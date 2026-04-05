package peerprep.matching.repositories;

import peerprep.matching.documents.WaitingQueueDoc;

public interface WaitingQueueRepositoryCustom {
    WaitingQueueDoc createIfNotExists(String category);
    void enqueueUser(String category, String userId);
    String dequeueUserAndReturn(String category);
    void removeUser(String category, String userId);
    void enqueueFront(String category, String userId);
}