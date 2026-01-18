@echo off
chcp 65001 >nul
echo ====================================
echo   网络小说写作助手 - 打包脚本
echo ====================================
echo.

REM 获取版本号（默认为 latest）
if "%1"=="" (
    set VERSION=latest
) else (
    set VERSION=%1
)

set PACKAGE_NAME=novel-writing-assistant-%VERSION%
set OUTPUT_DIR=.\dist

REM 清理旧的打包文件
echo 清理旧的打包文件...
if exist %OUTPUT_DIR% (
    rd /s /q %OUTPUT_DIR%
)
mkdir %OUTPUT_DIR%
mkdir %OUTPUT_DIR%\%PACKAGE_NAME%

REM 复制项目文件
echo 复制项目文件...

REM 复制主要文件和文件夹
xcopy /E /I /Y /Q /EXCLUDE:scripts\exclude.txt . %OUTPUT_DIR%\%PACKAGE_NAME%\

REM 创建压缩包
echo 创建压缩包...
cd %OUTPUT_DIR%

REM 使用 PowerShell 创建 zip
powershell -Command "Compress-Archive -Path '%PACKAGE_NAME%' -DestinationPath '%PACKAGE_NAME%.zip' -Force"

REM 获取文件大小
for %%I in (%PACKAGE_NAME%.zip) do set SIZE=%%~zI
set /a SIZE_MB=%SIZE% / 1048576

echo.
echo ====================================
echo ✅ 打包完成！
echo ====================================
echo.
echo 生成的文件：
echo   %OUTPUT_DIR%\%PACKAGE_NAME%.zip (~%SIZE_MB% MB)
echo.
echo 分享方式：
echo   1. 分享压缩包文件
echo   2. 或上传到网盘/文件分享服务
echo   3. 查看 SHARING_GUIDE.md 了解详细分享指南
echo.

pause
