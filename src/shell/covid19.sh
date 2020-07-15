#!/bin/bash
#東京コロナ状況
echo "파라미터 개수 : $#"
echo "첫 번째 파라미터: $1"
echo "모든 파라미터 내용 : $@"
WEBHOOKURL=`grep WEBHOOKURL ../config/* | awk -F '["]' '{print $4}'`

covidDate=`LANG=en_US.UTF-8 date '+%B %-d'`
covidDate2=`LANG=en_US.UTF-8 date '+%Y-%m-%d'`

if [[ -e ~/covid19/$covidDate2 && $1 == "" ]]; then
  echo "already done"
  exit
fi

curl -sS -L --retry 5 "https://stopcovid19.metro.tokyo.lg.jp/" --output ~/covid19.txt

todayCovid=`grep -A 3 "$covidDate" ~/covid19.txt | tail -3 | head -1`
totalCovid=`grep -A 3 "$covidDate" ~/covid19.txt | tail -1`

if [[ $todayCovid == "" ]]; then
  todayCovid="未発表"
  totalCovid="未発表"
fi

echo "◆本日("$covidDate2")都内の感染者数："$todayCovid
echo "◆都内の累積感染者数："$totalCovid

if [[ $todayCovid != "未発表" && $1 == "" ]]; then
  DATA_PAYLOAD="payload={\"text\": \"◆本日($covidDate2)都内の感染者数：$todayCovid\n◆都内の累積感染者数：$totalCovid\"}"
  WEBHOOKURL="$WEBHOOKURL"
  curl -s -S -X POST --data-urlencode "${DATA_PAYLOAD}" "${WEBHOOKURL}" > /dev/null 2>&1

  echo "◆本日("$covidDate2")都内の感染者数："$todayCovid > ~/covid19/$covidDate2
  echo "◆都内の累積感染者数："$totalCovid >> ~/covid19/$covidDate2
fi

if [[ $1 == "trigger" ]]; then
  echo "trigger Activate"

  DATA_PAYLOAD="payload={\"text\": \"◆本日($covidDate2)都内の感染者数：$todayCovid\n◆都内の累積感染者数：$totalCovid\"}"
  WEBHOOKURL="$WEBHOOKURL"
  curl -s -S -X POST --data-urlencode "${DATA_PAYLOAD}" "${WEBHOOKURL}" > /dev/null 2>&1

  if [[ $todayCovid != "未発表" ]]; then
    echo "◆本日("$covidDate2")都内の感染者数："$todayCovid > ~/covid19/$covidDate2
    echo "◆都内の累積感染者数："$totalCovid >> ~/covid19/$covidDate2
  fi
fi

rm -rf ~/covid19.txt
