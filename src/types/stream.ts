export interface IDNStream {
  name: string;
  img: string;
  img_alt?: string;
  url_key: string;
  slug: string;
  room_id: number;
  started_at: string;
  streaming_url_list: Array<{
    label: string;
    quality: number;
    url: string;
  }>;
  type: "idn";
}

export interface YouTubeStream {
  channelTitle: string;
  channelId: string;
  title: string;
  description: string;
  thumbnails: {
    default: { url: string; width: number; height: number };
    medium: { url: string; width: number; height: number };
    high: { url: string; width: number; height: number };
  };
  group: string;
  url: string;
  etag: string;
  type: "youtube";
}

export interface ShowroomStream {
  name: string;
  image: string;
  url: string;
  room_id: number;
  started_at: string;
  type: "showroom";
}

export interface StreamMember {
  room_id: number;
  name: string;
  url: string;
  image: string;
  started_at: string;
  type: "idn" | "showroom" | "youtube";
  is_live: boolean;
  streaming_url?: string;
  title?: string;
}

export type APIStream = IDNStream | YouTubeStream | ShowroomStream;
