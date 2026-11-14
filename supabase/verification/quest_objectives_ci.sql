-- Disposable CI PostgreSQL only. No application table, RPC or live data is touched.
BEGIN;
CREATE TEMP TABLE quest_snapshot_fixture (id text, campaign_id text, data_json jsonb);
DO $$
DECLARE
  original jsonb := '{"status":"active","notes":"keep","objectives":[{"id":"one","text":"Tower","done":false}]}';
  completed jsonb;
  affected integer;
BEGIN
  completed := jsonb_set(original, '{objectives,0,done}', 'true');
  INSERT INTO quest_snapshot_fixture VALUES ('quest', 'campaign', original);
  UPDATE quest_snapshot_fixture SET data_json = completed
    WHERE id = 'quest' AND campaign_id = 'campaign' AND data_json = original;
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected <> 1 THEN RAISE EXCEPTION 'Fresh snapshot failed'; END IF;
  UPDATE quest_snapshot_fixture SET data_json = original
    WHERE id = 'quest' AND campaign_id = 'campaign' AND data_json = original;
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected <> 0 THEN RAISE EXCEPTION 'Stale snapshot reverted completion'; END IF;
  UPDATE quest_snapshot_fixture SET data_json = original
    WHERE id = 'quest' AND campaign_id = 'foreign' AND data_json = completed;
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected <> 0 THEN RAISE EXCEPTION 'Campaign scope ignored'; END IF;
  IF (SELECT data_json FROM quest_snapshot_fixture) IS DISTINCT FROM completed THEN
    RAISE EXCEPTION 'Completion or unrelated fields changed';
  END IF;
  IF completed->>'status' <> 'active' OR completed->>'notes' <> 'keep' THEN
    RAISE EXCEPTION 'Status or notes changed';
  END IF;
  RAISE NOTICE 'PASS: quest JSONB snapshot equality rejects stale and foreign writes';
END;
$$;
ROLLBACK;
