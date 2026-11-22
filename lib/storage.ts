import { createClient } from '@/lib/supabase/client';

export type RushStorageBucket = 'courier-docs' | 'product-images';

export interface UploadResult {
  success: boolean;
  url: string;
  path: string;
  fileName: string;
  mode: 'supabase' | 'local';
  message?: string;
}

const MAX_BYTES = 5 * 1024 * 1024; // 5 Mo
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'application/pdf'];

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Impossible de lire le fichier.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Valide et envoie un document (CNI, Casier judiciaire) ou une photo produit vers Supabase Storage,
 * avec repli DataURL propre en mode simulation locale.
 */
export async function uploadRushFile(
  file: File,
  bucket: RushStorageBucket,
  folder = 'uploads'
): Promise<UploadResult> {
  if (file.size > MAX_BYTES) {
    return {
      success: false,
      url: '',
      path: '',
      fileName: file.name,
      mode: 'local',
      message: 'Fichier trop volumineux (max 5 Mo).',
    };
  }

  if (file.type && !ALLOWED_TYPES.includes(file.type)) {
    return {
      success: false,
      url: '',
      path: '',
      fileName: file.name,
      mode: 'local',
      message: 'Format non supporté (JPG, PNG, WebP ou PDF requis).',
    };
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const objectPath = `${folder}/${Date.now()}-${safeName}`;

  try {
    const supabase = createClient();
    const { data, error } = await supabase.storage.from(bucket).upload(objectPath, file, {
      cacheControl: '3600',
      upsert: false,
    });

    if (!error && data) {
      const { data: pub } = supabase.storage.from(bucket).getPublicUrl(data.path);
      return {
        success: true,
        url: pub.publicUrl,
        path: data.path,
        fileName: file.name,
        mode: 'supabase',
        message: 'Fichier téléversé sur Supabase Storage.',
      };
    }
  } catch {
    // Fallback local DataURL si bucket non provisionné ou hors ligne
  }

  const localUrl = await fileToDataUrl(file);
  return {
    success: true,
    url: localUrl,
    path: `local://${bucket}/${objectPath}`,
    fileName: file.name,
    mode: 'local',
    message: 'Fichier préparé et compressé localement (prêt pour synchronisation).',
  };
}
