package peerprep.matching.repositories;

import peerprep.matching.models.UserState;

public interface UserStateRepositoryCustom {
    void updateState(String userId, UserState newState);

    boolean upsertIfNotActive(
            String userId,
            String requestId,
            String userName,
            String category
    );
}