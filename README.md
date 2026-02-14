
Supabase uses:
WebSockets
Postgres logical replication
Realtime server

 Supabase realtime isn't connecting. Instead of relying on Supabase realtime, let's use BroadcastChannel (built into browsers) for instant cross-tab sync:BroadcastChannel — It's a browser API that lets different tabs talk to each other:
One tab posts a message: channel.postMessage()
Other tabs receive it: channel.onmessage
Much simpler and more reliable than Supabase realtime for cross-tab sync