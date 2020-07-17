#!/bin/bash
#東京コロナ状況
echo "파라미터 개수 : $#"
echo "첫 번째 파라미터: $1"
echo "모든 파라미터 내용 : $@"
WEBHOOKURL=`grep WEBHOOKURL ./config/* | awk -F '["]' '{print $4}'`

covidDate=`date '+%Y%m%d'`
covidDate2=`date '+%Y-%m-%d'`
covidDateLast=`date '+%Y-%m-%d' --date '1 days ago'`
lastTotalCovid=`cat ~/covid19/$covidDateLast | head -1`

if [[ -e ~/covid19/$covidDate2 && $1 == "" ]]; then
  echo "already done"
  exit
fi

curl -sS --retry 5 "https://covid19-japan-web-api.now.sh/api/v1/prefectures" --output ~/covid19.txt

todayTotalCovid=`jq .[12].cases ~/covid19.txt`
todayDateCheck=`jq .[12].last_updated.cases_date ~/covid19.txt`

echo $todayTotalCovid

if [[ $covidDate != $todayDateCheck ]]; then
	todayCovid="未発表"
	totalCovid="未発表"
fi

todayCovid=`expr $todayTotalCovid - $lastTotalCovid`


echo "◆本日("$covidDate2")都内の感染者数："$todayCovid
echo "◆都内の累積感染者数："$todayTotalCovid

if [[ $todayCovid != "未発表" && $1 == "" ]]; then
  DATA_PAYLOAD="payload={\"text\": \"◆本日($covidDate2)都内の感染者数：$todayCovid\n◆都内の累積感染者数：$totalCovid\"}"
  WEBHOOKURL="$WEBHOOKURL"
  curl -s -S -X POST --data-urlencode "${DATA_PAYLOAD}" "${WEBHOOKURL}" > /dev/null 2>&1

  echo $todayTotalCovid > ~/covid19/$covidDate2
  echo $todayCovid >> ~/covid19/$covidDate2
fi

if [[ $1 == "trigger" ]]; then
  echo "trigger Activate"

  DATA_PAYLOAD="payload={\"text\": \"◆本日($covidDate2)都内の感染者数：$todayCovid\n◆都内の累積感染者数：$totalCovid\"}"
  WEBHOOKURL="$WEBHOOKURL"
  curl -s -S -X POST --data-urlencode "${DATA_PAYLOAD}" "${WEBHOOKURL}" > /dev/null 2>&1

  if [[ $todayCovid != "未発表" ]]; then
    echo $todayTotalCovid > ~/covid19/$covidDate2
  	echo $todayCovid >> ~/covid19/$covidDate2
  fi
fi

# rm -rf ~/covid19.txt
