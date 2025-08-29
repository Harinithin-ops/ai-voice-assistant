@echo off
echo Installing requirements...
pip install -r requirements.txt

echo Starting FastAPI server...
python main.py

pause
