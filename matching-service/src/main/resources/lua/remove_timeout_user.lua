-- KEYS[1] = userId

local topic = redis.call('HGET', 'userState:' .. KEYS[1], 'topic')
local language = redis.call('HGET', 'userState:' .. KEYS[1], 'language')
local difficulty = redis.call('HGET', 'userState:' .. KEYS[1], 'difficulty')
local state = redis.call('HGET', 'userState:' .. KEYS[1], 'state')

redis.call('ZREM', 'timeout:queue', KEYS[1])

if state ~= 'PENDING' then
    return 0
end

if topic and language and difficulty then
    redis.call('ZREM', 'queue:' .. topic .. ':' .. language .. ':' .. string.upper(difficulty), KEYS[1])
end

redis.call('HSET', 'userState:' .. KEYS[1], 'state', 'TIMED_OUT')

return 1
