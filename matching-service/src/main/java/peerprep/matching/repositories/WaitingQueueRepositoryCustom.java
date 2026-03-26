package peerprep.matching.repositories;

public interface WaitingQueueRepositoryCustom {
    void enqueueUser(String category, String userId);
    String dequeueUserAndReturn(String category);
    void removeUser(String category, String userId);
    void enqueueFront(String category, String userId);
}