local userId = KEYS[1]
local requestId = KEYS[2]
local userName = KEYS[3]
local topic = KEYS[4]
local language = KEYS[5]
local difficulty = KEYS[6]
local joinTime = ARGV[1]
local expiryTime = ARGV[2]

local existingState = redis.call('HGET', 'userState:' .. userId, 'state')

if existingState == 'PENDING' or existingState == 'MATCH_FOUND' or existingState == 'MATCHED' then
    return 0
end

local userState = {
    'userId', userId,
    'requestId', requestId,
    'userName', userName,
    'state', 'PENDING',
    'topic', topic,
    'language', language,
    'difficulty', difficulty,
    'joinTime', joinTime
}
redis.call('HMSET', 'userState:' .. userId, unpack(userState))

redis.call('SET', 'requestUser:' .. requestId, userId)
redis.call('SET', 'userRequest:' .. userId, requestId)

local queueKey = 'queue:' .. topic .. ':' .. language .. ':' .. difficulty
redis.call('ZADD', queueKey, joinTime, userId)

redis.call('ZADD', 'timeout:queue', expiryTime, userId)

redis.call('SADD', 'dirtyScopes', topic .. ':' .. language)

return 1
