-- Internal broadcast triggers are invoked by PostgreSQL triggers, not via PostgREST RPC.
-- REVOKE EXECUTE blocks anonymous and authenticated RPC calls without disabling triggers.
begin;

revoke execute on function public.broadcast_fog_changes() from public, anon, authenticated;
revoke execute on function public.broadcast_handout_changes() from public, anon, authenticated;
revoke execute on function public.broadcast_message_changes() from public, anon, authenticated;
revoke execute on function public.broadcast_music_state() from public, anon, authenticated;
revoke execute on function public.broadcast_scene_walls() from public, anon, authenticated;
revoke execute on function public.broadcast_summon_requests() from public, anon, authenticated;
revoke execute on function public.broadcast_token_changes() from public, anon, authenticated;
revoke execute on function public.broadcast_token_owners() from public, anon, authenticated;

commit;
