-- KEYS[1] = user1
-- KEYS[2] = user2

local topic1 = redis.call('HGET', 'userState:' .. KEYS[1], 'topic')
local language1 = redis.call('HGET', 'userState:' .. KEYS[1], 'language')
local difficulty1 = redis.call('HGET', 'userState:' .. KEYS[1], 'difficulty')
local joinTime1 = redis.call('HGET', 'userState:' .. KEYS[1], 'joinTime')

local topic2 = redis.call('HGET', 'userState:' .. KEYS[2], 'topic')
local language2 = redis.call('HGET', 'userState:' .. KEYS[2], 'language')
local difficulty2 = redis.call('HGET', 'userState:' .. KEYS[2], 'difficulty')
local joinTime2 = redis.call('HGET', 'userState:' .. KEYS[2], 'joinTime')

redis.call('HSET', 'userState:' .. KEYS[1], 'state', 'PENDING')
redis.call('HSET', 'userState:' .. KEYS[2], 'state', 'PENDING')

redis.call('DEL', 'userMatch:' .. KEYS[1])
redis.call('DEL', 'userMatch:' .. KEYS[2])
redis.call('DEL', 'matchFoundAt:' .. KEYS[1])
redis.call('DEL', 'matchFoundAt:' .. KEYS[2])

redis.call('SREM', 'matchFoundUsers', KEYS[1])
redis.call('SREM', 'matchFoundUsers', KEYS[2])
redis.call('SREM', 'pendingFinalizations', KEYS[1] .. ':' .. KEYS[2])

local timeout1 = tonumber(joinTime1) + 120000
local timeout2 = tonumber(joinTime2) + 120000

redis.call('ZADD', 'queue:' .. topic1 .. ':' .. language1 .. ':' .. string.upper(difficulty1), joinTime1, KEYS[1])
redis.call('ZADD', 'timeout:queue', timeout1, KEYS[1])

redis.call('ZADD', 'queue:' .. topic2 .. ':' .. language2 .. ':' .. string.upper(difficulty2), joinTime2, KEYS[2])
redis.call('ZADD', 'timeout:queue', timeout2, KEYS[2])

redis.call('SADD', 'dirtyScopes', topic1 .. ':' .. language1)

return 1
