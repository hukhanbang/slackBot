#!/bin/bash

if [[ ! -d ~/whattoday ]]; then
	mkdir ~/whattoday
fi

whattodayDate=`LANG=ja_JP.UTF-8 date '+%B%-d'`
whattodayDate2=`LANG=ja_JP.UTF-8 date '+%Y-%m-%d'`

if [[ -e ~/whattoday/$whattodayDate2 ]]; then
	whattodayTitle=`cat ~/whattoday/$whattodayDate2 | head -1 | awk -F '[[]' '{print $2}' | awk -F '[]]' '{print $1}'`
	whattodayContents=`cat ~/whattoday/$whattodayDate2 | tail -1 | awk -F '[[]' '{print $2}' | awk -F '[]]' '{print $1}'`
else
	curl -L https://kids.yahoo.co.jp/today/ --output ~/whattoday/whattoday

	whattodayTitle=`grep '7月13日' ~/whattoday/whattoday | head -1 | awk -F '[>]' '{print $2}' | awk '{print $1}'`
	whattodayContents=`grep '<dd>' ~/whattoday/whattoday | head -1 | awk -F '[>]' '{print $2}' | awk -F '[<]' '{print $1}'`
fi

echo "◆今日は["$whattodayTitle"]の日" | tee ~/whattoday/$whattodayDate2
echo "◆詳細は["$whattodayContents"]" | tee -a ~/whattoday/$whattodayDate2

rm -rf ~/whattoday/whattoday
