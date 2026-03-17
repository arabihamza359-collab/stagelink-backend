const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

const uploadFile = async (fileBuffer, originalName, folder = 'uploads') => {
  try {
    const fileName = `${folder}/${Date.now()}-${originalName.replace(/\s+/g, '_')}`;
    
    const { data, error } = await supabase.storage
      .from('public-assets')
      .upload(fileName, fileBuffer, {
        contentType: 'auto',
        upsert: false
      });

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage
      .from('public-assets')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.error('Storage upload error:', err);
    throw new Error('Failed to upload file to storage');
  }
};

module.exports = {
  uploadFile
};
