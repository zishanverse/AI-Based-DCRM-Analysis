"""Train and evaluate an AdaBoost classifier for DCRM health prediction.

This script reuses the shared preprocessing pipeline and focuses solely on the
classical AdaBoost workflow: loading data, fitting the model, evaluating,
visualizing, and saving the trained estimator.
"""
from __future__ import annotations

import sys
from pathlib import Path

import matplotlib.pyplot as plt
import seaborn as sns
from joblib import dump
from sklearn.ensemble import AdaBoostClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.tree import DecisionTreeClassifier

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from data_preprocessing import load_preprocessed_data

ARTIFACT_DIR = Path(__file__).resolve().parent


def train_adaboost(X_train, y_train):
    """Fit an AdaBoost classifier using a shallow decision stump as the base learner."""
    # Decision stumps (depth=1 trees) are the classic AdaBoost building blocks.
    base_estimator = DecisionTreeClassifier(max_depth=1, random_state=42)
    model = AdaBoostClassifier(
        estimator=base_estimator,
        n_estimators=200,
        learning_rate=0.5,
        random_state=42,
    )
    model.fit(X_train, y_train)
    return model


def evaluate_model(model, X_test, y_test, encoder):
    """Print textual metrics and return machine-readable artifacts for plotting."""
    print("\n=== Evaluation Metrics ===")
    # Generate predictions on the held-out test split.
    predictions = model.predict(X_test)
    accuracy = accuracy_score(y_test, predictions)
    report_dict = classification_report(
        y_test,
        predictions,
        target_names=encoder.classes_,
        zero_division=0,
        output_dict=True,
    )
    report_text = classification_report(
        y_test,
        predictions,
        target_names=encoder.classes_,
        zero_division=0,
    )
    print(f"Accuracy: {accuracy:.4f}")
    print("\nClassification Report:")
    print(report_text)

    cm = confusion_matrix(y_test, predictions)
    return cm, report_dict


def plot_confusion_matrix(cm, encoder, filename="adaboost_confusion_matrix.png"):
    """Visualize and persist the confusion matrix so reports can embed it later."""
    output_path = ARTIFACT_DIR / filename
    plt.figure(figsize=(8, 6))
    sns.heatmap(
        cm,
        annot=True,
        fmt="d",
        cmap="Blues",
        xticklabels=encoder.classes_,
        yticklabels=encoder.classes_,
    )
    plt.title("AdaBoost Confusion Matrix")
    plt.ylabel("True Label")
    plt.xlabel("Predicted Label")
    plt.tight_layout()
    plt.savefig(output_path, dpi=300)
    plt.close()
    print(f"Confusion matrix saved to {output_path}")


def plot_precision_recall(
    report_dict,
    encoder,
    filename="adaboost_precision_recall.png",
):
    """Bar chart comparing per-class precision and recall for transparency."""
    output_path = ARTIFACT_DIR / filename
    labels = list(encoder.classes_)
    precision_scores = [report_dict[label]["precision"] for label in labels]
    recall_scores = [report_dict[label]["recall"] for label in labels]

    x_positions = range(len(labels))
    width = 0.35

    plt.figure(figsize=(10, 6))
    plt.bar([x - width / 2 for x in x_positions], precision_scores, width=width, label="Precision")
    plt.bar([x + width / 2 for x in x_positions], recall_scores, width=width, label="Recall")
    plt.xticks(list(x_positions), labels, rotation=15)
    plt.ylim(0, 1)
    plt.ylabel("Score")
    plt.title("AdaBoost Precision vs Recall")
    plt.legend()
    plt.tight_layout()
    plt.savefig(output_path, dpi=300)
    plt.close()
    print(f"Precision/Recall chart saved to {output_path}")


def save_model(model, filename="adaboost_model.pkl"):
    """Persist the trained AdaBoost model so that dashboards can reuse it."""
    output_path = ARTIFACT_DIR / filename
    dump(model, output_path)
    print(f"Model saved to {output_path}")


def main():
    """End-to-end workflow for training, evaluating, and saving AdaBoost."""
    # 1) Load preprocessed, flattened signals plus their encoded labels.
    X_train, X_test, y_train, y_test, encoder = load_preprocessed_data()

    # 2) Train the AdaBoost classifier.
    model = train_adaboost(X_train, y_train)

    # 3) Evaluate on the test split to understand accuracy and per-class stats.
    cm, report_dict = evaluate_model(model, X_test, y_test, encoder)

    # 4) Turn the metrics into reusable visualizations for reports/dashboards.
    plot_confusion_matrix(cm, encoder)
    plot_precision_recall(report_dict, encoder)

    # 5) Save the trained model so downstream apps can load it quickly.
    save_model(model)


if __name__ == "__main__":
    main()
