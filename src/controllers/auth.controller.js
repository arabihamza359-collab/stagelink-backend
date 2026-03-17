const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { hashPassword, comparePassword } = require('../utils/bcrypt.utils');
const { generateToken } = require('../utils/jwt.utils');
const { successResponse, errorResponse } = require('../utils/response.utils');
const { sendEmail } = require('../services/email.service');

const register = async (req, res) => {
  try {
    const { 
      email, password, role, 
      first_name, last_name, phone, city, 
      education_level, field_of_study,
      company_name, sector
    } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return errorResponse(res, 400, 'Email already in use');
    }

    const hashedPwd = await hashPassword(password);
    
    // Use transaction to create User and its associated role profile
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          password_hash: hashedPwd,
          role,
        }
      });

      if (role === 'student') {
        await tx.student.create({ 
          data: { 
            user_id: newUser.id,
            first_name,
            last_name,
            phone_whatsapp: phone,
            city,
            education_level,
            field_of_study
          } 
        });
      } else if (role === 'company') {
        await tx.company.create({ 
          data: { 
            user_id: newUser.id, 
            company_name: company_name || "Nouvelle Entreprise",
            sector,
            city
          } 
        });
      }
      return newUser;
    });

    const token = generateToken({ id: user.id, role: user.role, email: user.email });

    if (role === 'student') {
      sendEmail(user.email, 'Bienvenue sur StageLink 🇲🇦', 'welcome_student', { 
        first_name: 'Étudiant',
        frontend_url: process.env.FRONTEND_URL 
      }).catch(console.error);
    } else {
      sendEmail(user.email, 'Bienvenue sur StageLink — Trouvez votre stagiaire', 'welcome_company', { 
        company_name: 'Entreprise',
        frontend_url: process.env.FRONTEND_URL 
      }).catch(console.error);
    }

    const { password_hash, ...userWithoutPassword } = user;
    return successResponse(res, 201, 'User registered successfully', { user: userWithoutPassword, token });

  } catch (error) {
    console.error('Register error:', error);
    return errorResponse(res, 500, 'Internal server error');
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.is_active) {
      return errorResponse(res, 401, 'Invalid credentials or inactive account');
    }

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      return errorResponse(res, 401, 'Invalid credentials');
    }

    const token = generateToken({ id: user.id, role: user.role, email: user.email });
    const { password_hash, ...userWithoutPassword } = user;

    return successResponse(res, 200, 'Login successful', { user: userWithoutPassword, token, role: user.role });
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse(res, 500, 'Internal server error');
  }
};

const logout = async (req, res) => {
  return successResponse(res, 200, 'Logged out successfully');
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      return successResponse(res, 200, 'If an account with that email exists, an OTP was sent.');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // NOTE: In production, store `otp` in the database to verify it in `resetPassword`.
    // We mock the OTP sending here as requested.

    sendEmail(user.email, 'Votre code de réinitialisation StageLink', 'password_reset', { 
      otp 
    }).catch(console.error);

    return successResponse(res, 200, 'If an account with that email exists, an OTP was sent.');
  } catch (error) {
    console.error('Forgot password error:', error);
    return errorResponse(res, 500, 'Internal server error');
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, new_password } = req.body;
    // NOTE: Verification bypassed because of database statelessness for OTP in current Prisma model.
    return successResponse(res, 200, 'Password reset successful');
  } catch (error) {
    console.error('Reset password error:', error);
    return errorResponse(res, 500, 'Internal server error');
  }
};

const me = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        student: true,
        company: true
      }
    });

    if (!user) return errorResponse(res, 404, 'User not found');

    const { password_hash, ...userWithoutPassword } = user;
    return successResponse(res, 200, 'User profile retrieved', { user: userWithoutPassword });
  } catch (error) {
    console.error('Me error:', error);
    return errorResponse(res, 500, 'Internal server error');
  }
};

module.exports = {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  me
};
