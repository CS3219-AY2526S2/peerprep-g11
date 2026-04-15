local queueKey = 'queue:' .. KEYS[1] .. ':' .. KEYS[2] .. ':' .. KEYS[3]
local userIds = redis.call('ZRANGE', queueKey, 0, 1)

if #userIds < 2 then
    return nil
end

local user1, user2 = userIds[1], userIds[2]

local state1 = redis.call('HGET', 'userState:' .. user1, 'state')
local state2 = redis.call('HGET', 'userState:' .. user2, 'state')

if state1 ~= 'PENDING' then
    redis.call('ZREM', queueKey, user1)
end
if state2 ~= 'PENDING' then
    redis.call('ZREM', queueKey, user2)
end

if state1 ~= 'PENDING' or state2 ~= 'PENDING' then
    return nil
end

redis.call('ZREM', queueKey, user1, user2)
redis.call('ZREM', 'timeout:queue', user1, user2)
redis.call('HSET', 'userState:' .. user1, 'state', 'MATCH_FOUND')
redis.call('HSET', 'userState:' .. user2, 'state', 'MATCH_FOUND')
redis.call('SADD', 'matchFoundUsers', user1)
redis.call('SADD', 'matchFoundUsers', user2)
redis.call('SET', 'matchFoundAt:' .. user1, ARGV[1])
redis.call('SET', 'matchFoundAt:' .. user2, ARGV[1])

return {user1, user2}
