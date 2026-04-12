-- KEYS[1] = userId

local state = redis.call('HGET', 'userState:' .. KEYS[1], 'state')

if not state or state ~= 'PENDING' then
    return 0
end

local topic = redis.call('HGET', 'userState:' .. KEYS[1], 'topic')
local language = redis.call('HGET', 'userState:' .. KEYS[1], 'language')
local difficulty = redis.call('HGET', 'userState:' .. KEYS[1], 'difficulty')
local requestId = redis.call('HGET', 'userState:' .. KEYS[1], 'requestId')

if topic and language and difficulty then
    redis.call('ZREM', 'queue:' .. topic .. ':' .. language .. ':' .. difficulty, KEYS[1])
end

redis.call('ZREM', 'timeout:queue', KEYS[1])

if requestId then
    redis.call('DEL', 'requestUser:' .. requestId)
end
redis.call('DEL', 'userRequest:' .. KEYS[1])
redis.call('DEL', 'userState:' .. KEYS[1])

return 1
