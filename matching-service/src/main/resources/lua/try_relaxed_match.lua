local queue1 = 'queue:' .. KEYS[1] .. ':' .. KEYS[2] .. ':' .. KEYS[3]
local queue2 = 'queue:' .. KEYS[1] .. ':' .. KEYS[2] .. ':' .. KEYS[4]

local userIds1 = redis.call('ZRANGE', queue1, 0, 0)
local userIds2 = redis.call('ZRANGE', queue2, 0, 0)

if #userIds1 < 1 or #userIds2 < 1 then
    return nil
end

local user1, user2 = userIds1[1], userIds2[1]

local state1 = redis.call('HGET', 'userState:' .. user1, 'state')
local state2 = redis.call('HGET', 'userState:' .. user2, 'state')

if state1 ~= 'PENDING' or state2 ~= 'PENDING' then
    return nil
end

redis.call('ZREM', queue1, user1)
redis.call('ZREM', queue2, user2)
redis.call('ZREM', 'timeout:queue', user1, user2)
redis.call('HSET', 'userState:' .. user1, 'state', 'MATCH_FOUND')
redis.call('HSET', 'userState:' .. user2, 'state', 'MATCH_FOUND')
redis.call('SADD', 'matchFoundUsers', user1)
redis.call('SADD', 'matchFoundUsers', user2)
redis.call('SET', 'matchFoundAt:' .. user1, ARGV[1])
redis.call('SET', 'matchFoundAt:' .. user2, ARGV[1])

return {user1, user2}
