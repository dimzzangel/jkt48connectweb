import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Comment {
  id: string;
  user_id: string;
  username: string;
  message: string;
  created_at: string;
}

interface LiveCommentsProps {
  streamCode: string;
}

export const LiveComments = ({ streamCode }: LiveCommentsProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Get current user
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setCurrentUserId(session.user.id);
        // Get username from profiles
        supabase
          .from('profiles')
          .select('username')
          .eq('user_id', session.user.id)
          .single()
          .then(({ data }) => {
            if (data) {
              setCurrentUsername(data.username);
            }
          });
      }
    });
  }, []);

  useEffect(() => {
    // Fetch existing comments
    const fetchComments = async () => {
      const { data, error } = await supabase
        .from('live_comments')
        .select('*')
        .eq('stream_code', streamCode)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setComments(data);
        // Auto scroll to bottom after loading
        setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
        }, 100);
      }
    };

    fetchComments();

    // Subscribe to new comments
    const channel = supabase
      .channel(`live_comments:${streamCode}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_comments',
          filter: `stream_code=eq.${streamCode}`
        },
        (payload) => {
          setComments((prev) => [...prev, payload.new as Comment]);
          // Auto scroll to bottom
          setTimeout(() => {
            if (scrollRef.current) {
              scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
          }, 100);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'live_comments',
          filter: `stream_code=eq.${streamCode}`
        },
        (payload) => {
          setComments((prev) => prev.filter((c) => c.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamCode]);

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim() || !currentUserId) {
      return;
    }

    const { error } = await supabase
      .from('live_comments')
      .insert({
        stream_code: streamCode,
        user_id: currentUserId,
        username: currentUsername,
        message: newComment.trim(),
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to send comment",
        variant: "destructive",
      });
    } else {
      setNewComment("");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    const { error } = await supabase
      .from('live_comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-lg">Live Chat</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4" ref={scrollRef}>
          <div className="space-y-3">
            {comments.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">
                No comments yet. Be the first to comment!
              </p>
            ) : (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  className="bg-muted rounded-lg p-3 group hover:bg-muted/80 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-primary">
                        {comment.username}
                      </p>
                      <p className="text-sm mt-1 break-words">{comment.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(comment.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    {currentUserId === comment.user_id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteComment(comment.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        {currentUserId ? (
          <form onSubmit={handleSendComment} className="mt-4 flex gap-2">
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Type your comment..."
              maxLength={500}
            />
            <Button type="submit" size="sm" disabled={!newComment.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground text-center mt-4">
            Please login to comment
          </p>
        )}
      </CardContent>
    </Card>
  );
};
