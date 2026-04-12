redis.call('SADD', 'pendingFinalizations', KEYS[1] .. ':' .. KEYS[2])
return 1
