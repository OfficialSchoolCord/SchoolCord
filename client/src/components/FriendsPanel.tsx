import { useState } from 'react';
import { X, Users, UserPlus, UserCheck, UserX, MessageCircle, Search, Clock, Ban, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface FriendsPanelProps {
  onClose: () => void;
  sessionId: string | null;
  onStartDM: (userId: string) => void;
}

interface Friend {
  id: string;
  username: string;
  profilePicture?: string;
  level?: number;
  friendshipId: string;
}

interface FriendRequest {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: string;
  requesterUser?: {
    id: string;
    username: string;
    profilePicture?: string;
    level?: number;
  };
}

interface SearchUser {
  id: string;
  username: string;
  profilePicture?: string;
  level?: number;
}

export function FriendsPanel({ onClose, sessionId, onStartDM }: FriendsPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends');
  const { toast } = useToast();

  const { data: friendsData, isLoading: friendsLoading } = useQuery<{ friends: Friend[] }>({
    queryKey: ['/api/friends'],
    enabled: !!sessionId,
  });

  const { data: requestsData, isLoading: requestsLoading } = useQuery<{ incoming: FriendRequest[]; outgoing: FriendRequest[] }>({
    queryKey: ['/api/friend-requests'],
    enabled: !!sessionId,
  });

  const { data: searchData, isLoading: searchLoading } = useQuery<{ users: SearchUser[] }>({
    queryKey: ['/api/users/search', searchQuery],
    enabled: !!sessionId && searchQuery.length >= 2,
  });

  const sendRequestMutation = useMutation({
    mutationFn: async (addresseeId: string) => {
      return apiRequest('/api/friend-requests', {
        method: 'POST',
        body: JSON.stringify({ addresseeId }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/friend-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/search'] });
      toast({ title: 'Friend request sent' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to send request', description: error.message, variant: 'destructive' });
    },
  });

  const acceptRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return apiRequest(`/api/friend-requests/${requestId}/accept`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/friends'] });
      queryClient.invalidateQueries({ queryKey: ['/api/friend-requests'] });
      toast({ title: 'Friend request accepted' });
    },
  });

  const declineRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return apiRequest(`/api/friend-requests/${requestId}/decline`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/friend-requests'] });
      toast({ title: 'Friend request declined' });
    },
  });

  const removeFriendMutation = useMutation({
    mutationFn: async (friendId: string) => {
      return apiRequest(`/api/friends/${friendId}/remove`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/friends'] });
      toast({ title: 'Friend removed' });
    },
  });

  const friends = friendsData?.friends || [];
  const incomingRequests = requestsData?.incoming || [];
  const outgoingRequests = requestsData?.outgoing || [];
  const searchResults = searchData?.users || [];

  return (
    <div 
      className="fixed inset-0 ml-16 flex items-center justify-center z-40 animate-fade-in"
      style={{
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
      }}
      data-testid="friends-panel"
    >
      <Card 
        className="w-full max-w-lg max-h-[80vh] border-white/10"
        style={{
          background: 'rgba(30, 20, 40, 0.95)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white/70 hover:text-white hover:bg-white/10"
              data-testid="button-back-friends"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Users className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold text-white">Friends</h2>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="w-full">
          <TabsList className="w-full bg-white/5 border-b border-white/10 rounded-none p-0">
            <TabsTrigger 
              value="friends" 
              className="flex-1 rounded-none data-[state=active]:bg-white/10 data-[state=active]:text-white"
              data-testid="tab-friends-list"
            >
              <Users className="w-4 h-4 mr-2" />
              Friends ({friends.length})
            </TabsTrigger>
            <TabsTrigger 
              value="requests" 
              className="flex-1 rounded-none data-[state=active]:bg-white/10 data-[state=active]:text-white"
              data-testid="tab-friend-requests"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Requests ({incomingRequests.length})
            </TabsTrigger>
            <TabsTrigger 
              value="search" 
              className="flex-1 rounded-none data-[state=active]:bg-white/10 data-[state=active]:text-white"
              data-testid="tab-add-friend"
            >
              <Search className="w-4 h-4 mr-2" />
              Add
            </TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="p-4 max-h-[60vh] overflow-y-auto">
            {friendsLoading ? (
              <div className="text-center py-8 text-white/50">Loading friends...</div>
            ) : friends.length === 0 ? (
              <div className="text-center py-8 text-white/50">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No friends yet</p>
                <p className="text-sm">Search for users to add friends</p>
              </div>
            ) : (
              <div className="space-y-2">
                {friends.map((friend) => (
                  <div 
                    key={friend.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    data-testid={`friend-item-${friend.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {friend.profilePicture ? (
                            <img src={friend.profilePicture} alt={friend.username} className="w-full h-full object-cover rounded-full" />
                          ) : (
                            friend.username.charAt(0).toUpperCase()
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-white font-medium">{friend.username}</p>
                        <p className="text-sm text-white/50">Level {friend.level || 1}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onStartDM(friend.id)}
                        className="text-white/70 hover:text-white hover:bg-white/10"
                        data-testid={`button-dm-${friend.id}`}
                      >
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeFriendMutation.mutate(friend.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                        data-testid={`button-remove-friend-${friend.id}`}
                      >
                        <UserX className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="requests" className="p-4 max-h-[60vh] overflow-y-auto">
            {requestsLoading ? (
              <div className="text-center py-8 text-white/50">Loading requests...</div>
            ) : incomingRequests.length === 0 && outgoingRequests.length === 0 ? (
              <div className="text-center py-8 text-white/50">
                <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No pending requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {incomingRequests.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-white/70 mb-2">Incoming Requests</h3>
                    <div className="space-y-2">
                      {incomingRequests.map((request) => (
                        <div 
                          key={request.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                          data-testid={`incoming-request-${request.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarFallback className="bg-primary/20 text-primary">
                                {request.requesterUser?.profilePicture ? (
                                  <img src={request.requesterUser.profilePicture} alt="" className="w-full h-full object-cover rounded-full" />
                                ) : (
                                  request.requesterUser?.username?.charAt(0).toUpperCase() || '?'
                                )}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-white font-medium">{request.requesterUser?.username || 'Unknown'}</p>
                              <p className="text-sm text-white/50">Wants to be your friend</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => acceptRequestMutation.mutate(request.id)}
                              className="bg-green-600 hover:bg-green-700"
                              data-testid={`button-accept-${request.id}`}
                            >
                              <UserCheck className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => declineRequestMutation.mutate(request.id)}
                              className="border-white/20 hover:bg-white/10"
                              data-testid={`button-decline-${request.id}`}
                            >
                              <UserX className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {outgoingRequests.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-white/70 mb-2">Sent Requests</h3>
                    <div className="space-y-2">
                      {outgoingRequests.map((request) => (
                        <div 
                          key={request.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                          data-testid={`outgoing-request-${request.id}`}
                        >
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-yellow-400 border-yellow-400/30">
                              Pending
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="search" className="p-4 max-h-[60vh] overflow-y-auto">
            <div className="mb-4">
              <Input
                placeholder="Search by username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/5 border-white/10 text-white"
                data-testid="input-search-users"
              />
            </div>
            
            {searchLoading ? (
              <div className="text-center py-8 text-white/50">Searching...</div>
            ) : searchQuery.length < 2 ? (
              <div className="text-center py-8 text-white/50">
                <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Enter at least 2 characters to search</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-8 text-white/50">No users found</div>
            ) : (
              <div className="space-y-2">
                {searchResults.map((user) => (
                  <div 
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                    data-testid={`search-result-${user.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {user.profilePicture ? (
                            <img src={user.profilePicture} alt={user.username} className="w-full h-full object-cover rounded-full" />
                          ) : (
                            user.username.charAt(0).toUpperCase()
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-white font-medium">{user.username}</p>
                        <p className="text-sm text-white/50">Level {user.level || 1}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => sendRequestMutation.mutate(user.id)}
                      disabled={sendRequestMutation.isPending}
                      data-testid={`button-add-friend-${user.id}`}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}