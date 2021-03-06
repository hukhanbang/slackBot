#!/bin/bash
gurunaviFile="./shell/gurunavi"
gurunaviAREAFile="./shell/gurunaviAREA"

if [[ $3 == "undefined" ]]; then
	echo -e "地域を設定してください\nぐるなび　食べ物　地域"
	exit
fi

#Area코드취득
URLAREA="https://api.gnavi.co.jp/master/GAreaMiddleSearchAPI/v3/?keyid=$1&lang=ja"
curl -L $URLAREA --output $gurunaviAREAFile --retry 10
AREANAME=`grep -n areaname_m $gurunaviAREAFile | grep $3 | head -1 | cut -d: -f1`
if [[ $AREANAME == "" ]]; then
	echo -e "対応しない地域です。\n駅名ではなく、地域名を書いてください。"
	exit
fi
AREANAME=`expr $AREANAME - 1`
AREACODE=`awk NR==$AREANAME $gurunaviAREAFile | awk -F '["]' '{print $4}'`

#가게검색
URL="https://api.gnavi.co.jp/RestSearchAPI/v3/?keyid=$1&freeword=$2&hit_per_page=100&areacode_m=$AREACODE"
curl -L $URL --output $gurunaviFile --retry 10
result=`jq .rest[].name $gurunaviFile`
if [[ $result == "" ]]; then
	echo "検索結果がありません。"
else
	jq '.rest[] | .name,.url' $gurunaviFile
fi



rm -rf $gurunaviFile
rm -rf $gurunaviAREAFile