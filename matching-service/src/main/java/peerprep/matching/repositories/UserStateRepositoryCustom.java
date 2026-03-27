package peerprep.matching.repositories;

public interface UserStateRepositoryCustom {
    boolean upsertIfNotPendingOrMatched(
            String userId,
            String requestId,
            String userName,
            String category
    );
}