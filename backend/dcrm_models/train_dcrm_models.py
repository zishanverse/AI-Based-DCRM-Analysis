import pandas as pd
import xgboost as xgb
from sklearn.ensemble import AdaBoostClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import joblib

# Load the uploaded dataset
df = pd.read_csv('multi_fault_dcrm_dataset.csv')

# Prepare X and y
X = df.drop(columns=['target_label', 'label_code'])
y = df['label_code']

# Split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train XGBoost
xgb_model = xgb.XGBClassifier(use_label_encoder=False, eval_metric='mlogloss', objective='multi:softmax', num_class=9)
xgb_model.fit(X_train, y_train)

# Train AdaBoost
# Using a Decision Tree base estimator is default
ada_model = AdaBoostClassifier(n_estimators=100, random_state=42, algorithm='SAMME')
ada_model.fit(X_train, y_train)

# Evaluate
xgb_pred = xgb_model.predict(X_test)
ada_pred = ada_model.predict(X_test)

print("XGBoost Accuracy:", accuracy_score(y_test, xgb_pred))
print("AdaBoost Accuracy:", accuracy_score(y_test, ada_pred))
print("\nXGBoost Report:\n", classification_report(y_test, xgb_pred))

# Save models (simulation)
joblib.dump(xgb_model, 'xgb_dcrm_model.pkl')
joblib.dump(ada_model, 'adaboost_dcrm_model.pkl')

# Save Label Mapping for the app
label_mapping = df[['label_code', 'target_label']].drop_duplicates().sort_values('label_code')
print(label_mapping)
label_mapping.to_csv('label_mapping.csv', index=False)