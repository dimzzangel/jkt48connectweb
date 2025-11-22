import { supabase } from "@/integrations/supabase/client";

interface StreamData {
  type?: string;
  streams?: Array<{ room_id?: number; url?: string }>;
  room_id?: number;
  url?: string;
  [key: string]: any;
}

export const generateStreamCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const getExistingStreamCode = async (streamData: StreamData): Promise<string | null> => {
  // Create a unique identifier based on stream data
  const streamIdentifier = streamData.type === 'multi' 
    ? JSON.stringify((streamData.streams || []).map((s: any) => s.room_id || s.url).sort())
    : String(streamData.room_id || streamData.url);

  const { data: existing } = await supabase
    .from('stream_codes')
    .select('code, stream_data')
    .eq('is_active', true)
    .gt('expires_at', new Date().toISOString());

  if (existing && existing.length > 0) {
    for (const record of existing) {
      const recordData = record.stream_data as StreamData;
      const existingIdentifier = recordData.type === 'multi'
        ? JSON.stringify((recordData.streams || []).map((s: any) => s.room_id || s.url).sort())
        : String(recordData.room_id || recordData.url);
      
      if (existingIdentifier === streamIdentifier) {
        return record.code;
      }
    }
  }

  return null;
};

export const saveStreamCode = async (streamData: StreamData): Promise<string> => {
  // Check if stream already has a code
  const existingCode = await getExistingStreamCode(streamData);
  if (existingCode) {
    return existingCode;
  }

  let code = generateStreamCode();
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const { data: existing } = await supabase
      .from('stream_codes')
      .select('code')
      .eq('code', code)
      .single();

    if (!existing) {
      const { error } = await supabase
        .from('stream_codes')
        .insert({
          code,
          stream_data: streamData,
          is_active: true
        });

      if (!error) {
        return code;
      }
    }

    code = generateStreamCode();
    attempts++;
  }

  throw new Error('Failed to generate unique code');
};

export const getStreamData = async (code: string): Promise<any> => {
  const { data, error } = await supabase
    .from('stream_codes')
    .select('stream_data, is_active, expires_at')
    .eq('code', code.toUpperCase())
    .single();

  if (error || !data || !data.is_active) {
    return null;
  }

  if (new Date(data.expires_at) < new Date()) {
    return null;
  }

  return data.stream_data;
};
