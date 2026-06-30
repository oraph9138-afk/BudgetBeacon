@echo off
setlocal enabledelayedexpansion

echo === Test 1: Python exists? ===
python --version
echo ERRORLEVEL=%ERRORLEVEL%

echo.
echo === Test 2: Python one-liner ===
python -c "import sys; v=sys.version_info; assert (3,10) <= (v.major, v.minor) <= (3,13), 'bad version'; print('OK')"
echo ERRORLEVEL=%ERRORLEVEL%

echo.
echo === Test 3: Python one-liner with 2>nul ===
python -c "import sys; v=sys.version_info; assert (3,10) <= (v.major, v.minor) <= (3,13), 'bad version'; print('OK')" 2>nul
echo ERRORLEVEL=%ERRORLEVEL%

echo.
echo === Test 4: if statement ===
python -c "import sys; print('Python works')" 2>nul
if %errorlevel% neq 0 (
  echo INSIDE ERROR BLOCK
  pause
  exit /b 1
)
echo AFTER ERROR BLOCK

echo.
echo === Test 5: Node existence ===
node --version
echo ERRORLEVEL=%ERRORLEVEL%

echo.
echo === All tests passed ===
pause
