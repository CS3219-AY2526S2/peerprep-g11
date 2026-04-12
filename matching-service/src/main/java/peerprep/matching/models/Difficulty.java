package peerprep.matching.models;

import java.util.List;
import java.util.Arrays;
import java.util.ArrayList;

public enum Difficulty {
    EASY("Easy"), 
    MEDIUM("Medium"), 
    HARD("Hard");

    private final String label;

    Difficulty(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    public static List<DifficultyPair> getAdjacentPairs() {
        Difficulty[] values = Difficulty.values();
        List<DifficultyPair> pairs = new ArrayList<>();

        for (int i = 0; i < values.length - 1; i++) {
            pairs.add(new DifficultyPair(values[i], values[i + 1]));
        }

        return pairs;
    }
}