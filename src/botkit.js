//초기설정
const { Botkit,BotkitConversation } = require('botkit');
const { SlackAdapter, SlackEventMiddleware,SlackMessageTypeMiddleware,SlackDialog } = require('botbuilder-adapter-slack');
const shell = require('shelljs');
const CONFIG = require('../config/bot.json');
const MUSIC = require('../data/musicList.json');
const UN = require('../config/userName.json');
const fs = require('fs')
const mysql = require('mysql')
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");
// let request = require('request');
const db = require('./db/db.js');
const cron = require('node-cron');
const connection = mysql.createConnection(db);
const keyid = CONFIG.GurunaviKEY
//초기설정

//모듈

//


//정규표현
var date_pattern = /^(19|20)\d{2}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[0-1])$/; 
var office_pattern = /^(TSC|MM|HOME|VAC)$/; 
var work_parameter_pattern = /^()|(私)|(19|20)\d{2}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[0-1])$/; 
//정규표현

//공통파츠
var img_url_mon="https://media.giphy.com/media/j3gbHp2WtFbbJgOTzM/giphy.gif";
var img_url_tue="https://media.giphy.com/media/WnOQTPskap76RaNNNc/giphy.gif";
var img_url_wed="https://media.giphy.com/media/1wXeZx1Skqk5iOXJEo/giphy.gif";
var img_url_thu="https://media.giphy.com/media/VsSksaIufXQR2/giphy.gif";
var img_url_fri="https://media.giphy.com/media/ZXliWMIXgcaBzkIqBd/giphy.gif";
var img_url_sat="https://media.giphy.com/media/T9LE9yLuTqmAFdxkbG/giphy.gif";
var img_url_sun="https://media.giphy.com/media/rnshwCdGdDyg0/giphy.gif";

function getTodayLabel() {
    var week = new Array('sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat');
    var today = new Date().getDay();
    var todayLabel = week[today];
    return todayLabel;
	}


var img_url
var dayOfTheWeek
if (getTodayLabel() == "mon"){
	img_url=img_url_mon
	dayOfTheWeek="月"
}else if(getTodayLabel() == "tue"){
	img_url=img_url_tue
	dayOfTheWeek="火"
}else if(getTodayLabel() == "wed"){
	img_url=img_url_wed
	dayOfTheWeek="水"
}else if(getTodayLabel() == "thu"){
	img_url=img_url_thu
	dayOfTheWeek="木"
}else if(getTodayLabel() == "fri"){
	img_url=img_url_fri
	dayOfTheWeek="金"
}else if(getTodayLabel() == "sat"){
	img_url=img_url_sat
	dayOfTheWeek="土"
}else if(getTodayLabel() == "sun"){
	img_url=img_url_sun
	dayOfTheWeek="日"
}else if(getTodayLabel() == "test"){
	img_url="https://lenarang.com/wp-content/uploads/2019/02/hwayoil.png"	 
}


function getTimeStamp() {

    var d = new Date();
    var s =
        leadingZeros(d.getFullYear(), 4) + '-' +
        leadingZeros(d.getMonth() + 1, 2) + '-' +
        leadingZeros(d.getDate(), 2);

    return s;
}

function leadingZeros(n, digits) {

    var zero = '';
    n = n.toString();

    if (n.length < digits) {
        for (i = 0; i < digits - n.length; i++)
            zero += '0';
    }
    return zero + n;
}
//공통파츠



//봇 기동관련
const adapter = new SlackAdapter({
  clientSigningSecret: CONFIG.TEST_SIGNING_SECRET,
  botToken: CONFIG.TEST_BOT_USER_OAUTH_ACCESS_TOKEN
  // Single Teamモードでは不要なパラメータなのですが、型で必須と言われてしまうので仕方なく書いてます。
});
// Slackのイベントを受け取れるようにします。
adapter.use(new SlackEventMiddleware());
adapter.use(new SlackMessageTypeMiddleware());

let controller = new Botkit({
    adapter: adapter
});

const botScope = [
	'direct_mention',
	'direct_message',
	'mention'
];
//봇 기동관련




//기능
controller.hears(['help','使い方'], botScope, async(bot, message) => {
	var manual="`@bot 勤怠登録　YYYY-MM-DD　(TSC,MM,HOME,VAC)or削除（削除の場合のみYYYY-MM-DDを削除）`　「勤怠を管理」\n`@bot 勤怠状況　私orYYYY-MM-DDor未入力`　「指定日に登録されている全ての勤怠を確認、未入力の場合、本日は確認」\n`@bot ぐるなび　食べ物名　地域名`　「お店情報調べる」\n`@bot 今日は何の日`　「今日が何の日か教えてくれる」\n`@bot 時間`　「今の時間」"
	await bot.reply(message, manual);
});


controller.hears(['音楽','music'], botScope, async(bot, message) => {
	var musicName
	var musicTitle
	var musicUrl
	var musicImage
	var musicSlackTItle
	var jsonLength = { stdout } = shell.exec('jq length ./data/musicList.json')
	var random=Math.floor( Math.random() * jsonLength + 0 )
	
	musicName=MUSIC[random].NAME
	musicTitle=MUSIC[random].TITLE
	musicUrl=MUSIC[random].URL
	musicImage=MUSIC[random].IMAGE
	
	var musicNameTitle=musicName+"_"+musicTitle
	musicSlackTItle="*<"+musicUrl+"|"+musicNameTitle+">*"

	var musicAttachment ={
    "channel": message.channel,
			"blocks": [
		{
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": musicSlackTItle
			}
		},
		{
			"type": "divider"
		},
		{
		"type": "image",
		"image_url": musicImage,
		"alt_text": musicNameTitle
		}
		]
	}
	await bot.reply(message, musicAttachment);
});


controller.hears(['今日は何の日'], botScope, async(bot, message) => {
	const { stdout, stderr, err } = shell.exec('./src/shell/whattoday.sh')
	console.log(stdout);
	
	
	var toSlackWhatToday = {
    "channel": message.channel,
			"blocks": [
		{
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": "*<https://kids.yahoo.co.jp/today/|今日は何の日>*"
			}
		},
		{
			"type": "divider"
		},
		{
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": stdout
			},
			"accessory": {
				"type": "image",
				"image_url": "https://rr.img.naver.jp/mig?src=http%3A%2F%2Fimgcc.naver.jp%2Fkaze%2Fmission%2FUSER%2F20160107%2F34%2F3187894%2F7%2F404x268x79f28944fe1d90834816f081.jpg%2F300%2F600&twidth=300&theight=600&qlt=80&res_format=jpg&op=r",
				"alt_text": "Today"
			}
		}
		]
	}
	
	await bot.reply(message, toSlackWhatToday);
});


controller.hears(['時間'], botScope, async(bot, message) => { 
	let SlackTime = moment().format("YYYY年MM月DD日 HH:mm:ss dddd");
	console.log(SlackTime);
    await bot.reply(message,SlackTime);
});


controller.hears(['ぐるなび'], botScope, async(bot, message) => { 
	console.log(message.text);
	var gurunaviTextFtH = message.text.replace(/　/g," ");
	var gurunaviText = gurunaviTextFtH.split(' ')
		
	if (gurunaviText[1] == "help"){
	  	await bot.reply(message,"使い方→@bot ぐるなび　食べ物名　地域名");
	  	return;
	 }
	
	var encodegurunavi = encodeURIComponent( gurunaviText[1] )
	const { stdout, stderr, err } = shell.exec(`./src/shell/gurunavi.sh ${keyid} ${encodegurunavi} ${gurunaviText[2]}`)
	
	var stdoutArray = stdout.split('\n')
	// var stdoutArray_splice = stdoutArray.splice(0,4);
	var stdoutSlack = stdoutArray.join('\n')
	var stdoutSlack2 = stdoutSlack.replace(/["]/g, "")

	await bot.reply(message,stdoutSlack2);
});
//기능

//회사
controller.hears(['勤怠状況'], botScope, async(bot, message) => {
	var dateToday
	var vacationCheckArrayFtH = message.text.replace(/　/g," ");
	var vacationCheckArrayNL = vacationCheckArrayFtH.split('\n')
	var vacationArray = vacationCheckArrayNL[0].split(' ')
	var userId="<@"+message.user+">"
	
	if (getTodayLabel() == "mon"){
		dayOfTheWeek="月"
	}
	
	
	
	if (!work_parameter_pattern.test(vacationArray[1])){
		await bot.replyInThread(message, "パラメータは「私」or「YYYY-MM-DD」で入力してください。")
		return;
	}
	
	if (vacationArray[1] == "私"){
		var SQLSELECTMINE = fs.readFileSync('./src/db/sql/selectTimeNotOnWorkMine.sql').toString();
		SQLSELECTMINE=SQLSELECTMINE+"'"+userId+"';";
		console.log(SQLSELECTMINE)
		var { stdout, stderr, err } = shell.exec(`mysql -u ${db.user} -p${db.password} -D ${db.database} -e "${SQLSELECTMINE}" | sed 's/'name'/''/g' | sed 's/'location'/''/g' | sed 's/'notWorkDate'/''/g'`)
		var sqlShell =stdout
		if (sqlShell == ""){
			sqlShell="\n1件も勤怠が登録されていません。"
		}
		await bot.replyInThread(message, sqlShell);
		return;
	}else{
		if (vacationArray[1] == undefined){
			dateToday=getTimeStamp();
		}else{
			dateToday=vacationArray[1];
			var week = new Array('sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat');
			var today = new Date(dateToday).getDay();
			var dayOfTheWeekArray = week[today];
			if (dayOfTheWeekArray == "mon"){
				img_url=img_url_mon
				dayOfTheWeek="月"
			}else if(dayOfTheWeekArray == "tue"){
				img_url=img_url_tue
				dayOfTheWeek="火"
			}else if(dayOfTheWeekArray == "wed"){
				img_url=img_url_wed
				dayOfTheWeek="水"
			}else if(dayOfTheWeekArray == "thu"){
				img_url=img_url_thu
				dayOfTheWeek="木"
			}else if(dayOfTheWeekArray == "fri"){
				img_url=img_url_fri
				dayOfTheWeek="金"
			}else if(dayOfTheWeekArray == "sat"){
				img_url=img_url_sat
				dayOfTheWeek="土"
			}else if(dayOfTheWeekArray == "sun"){
				img_url=img_url_sun
				dayOfTheWeek="日"
			}else if(dayOfTheWeekArray == "test"){
				img_url="https://lenarang.com/wp-content/uploads/2019/02/hwayoil.png"	 
			}
		}
	}
	
	console.log("쉘 실행전")
	var dateTodayForAll ="'"+dateToday+"';";
	var SQLSelectTSC = fs.readFileSync('./src/db/sql/selectTimeNotOnWorkTSC.sql').toString();
	SQLSelectTSC=SQLSelectTSC+dateTodayForAll
	var { stdout, stderr, err } = shell.exec(`mysql -u ${db.user} -p${db.password} -D ${db.database} -e "${SQLSelectTSC}" | sed 's/'name'/''/g' | sed 's/'location'/''/g'`)
	var SQLResultTSC =stdout
	console.log(SQLResultTSC)
	
	var SQLSelectMM = fs.readFileSync('./src/db/sql/selectTimeNotOnWorkMM.sql').toString();
	SQLSelectMM=SQLSelectMM+dateTodayForAll
	var { stdout, stderr, err } = shell.exec(`mysql -u ${db.user} -p${db.password} -D ${db.database} -e "${SQLSelectMM}" | sed 's/'name'/''/g' | sed 's/'location'/''/g'`)
	var SQLResultMM =stdout
	console.log(SQLResultMM)
	
	var SQLSelectHOME = fs.readFileSync('./src/db/sql/selectTimeNotOnWorkHOME.sql').toString();
	SQLSelectHOME=SQLSelectHOME+dateTodayForAll
	var { stdout, stderr, err } = shell.exec(`mysql -u ${db.user} -p${db.password} -D ${db.database} -e "${SQLSelectHOME}" | sed 's/'name'/''/g' | sed 's/'location'/''/g'`)
	var SQLResultHOME =stdout
	console.log(SQLResultHOME)
	
	var SQLSelectVAC = fs.readFileSync('./src/db/sql/selectTimeNotOnWorkVAC.sql').toString();
	SQLSelectVAC=SQLSelectVAC+dateTodayForAll
	var { stdout, stderr, err } = shell.exec(`mysql -u ${db.user} -p${db.password} -D ${db.database} -e "${SQLSelectVAC}" | sed 's/'name'/''/g' | sed 's/'location'/''/g'`)
	var SQLResultVAC =stdout
	console.log(SQLResultVAC)
	
	if (SQLResultTSC == ""){SQLResultTSC="`なし`"};
	if (SQLResultMM == ""){SQLResultMM="`なし`"};
	if (SQLResultHOME == ""){SQLResultHOME="`なし`"};
	if (SQLResultVAC == ""){SQLResultVAC="`なし`"};
	
	
	var reply_with_attachments = {
		"channel": message.channel,
		"text": '勤怠管理 '+dateToday,
				"blocks": [
			{
				"type": "section",
				"text": {
					"type": "mrkdwn",
					"text": "*「"+dateToday+"("+dayOfTheWeek+")"+"」の勤怠*"
				},
			"accessory": {
					"type": "button",
					"text": {
						"type": "plain_text",
						"emoji": true,
						"text": "削除"
					},
					"style": "danger",
					"value": "delete"
				},
			},
			{
				"type": "divider"
			},
			{
				"type": "section",
				"text": {
					"type": "mrkdwn",
					"text": "*TSC*:office:\n勤務"
				},
				"accessory": {
					"type": "button",
					"text": {
						"type": "plain_text",
						"emoji": true,
						"text": "TSC"
					},
					"value": "TSC"
				},
			},
			{
				"type": "context",
				"elements": [
					{
						"type": "mrkdwn",
						"text": SQLResultTSC
					}
				]
			},
			{
				"type": "divider"
			},		
			{
				"type": "section",
				"text": {
					"type": "mrkdwn",
					"text": "*MM*:office:\n勤務"
				},
				"accessory": {
					"type": "button",
					"text": {
						"type": "plain_text",
						"emoji": true,
						"text": "MM"
					},
					"value": "MM"
				}
			},
			{
				"type": "context",
				"elements": [
					{
						"type": "mrkdwn",
						"text": SQLResultMM
					}
				]
			},
			{
				"type": "divider"
			},		
			{
				"type": "section",
				"text": {
					"type": "mrkdwn",
					"text": "*在宅*:house:\n勤務"
				},
				"accessory": {
					"type": "button",
					"text": {
						"type": "plain_text",
						"emoji": true,
						"text": "HOME"
					},
					"value": "HOME"
				}
			},
			{
				"type": "context",
				"elements": [
					{
						"type": "mrkdwn",
						"text": SQLResultHOME
					}
				]
			},
			{
				"type": "divider"
			},		
			{
				"type": "section",
				"text": {
					"type": "mrkdwn",
					"text": "*休み*:sunglasses:"
				},
				"accessory": {
					"type": "button",
					"text": {
						"type": "plain_text",
						"emoji": true,
						"text": "VAC"
					},
					"value": "VAC"
				}
			},
			{
				"type": "context",
				"elements": [
					{
						"type": "mrkdwn",
						"text": SQLResultVAC
					}
				]
			},
			{
				"type": "divider"
			},
				{
				"type": "actions",
				"elements": [
									{
						"type": "button",
						"text": {
							"type": "plain_text",
							"emoji": true,
							"text": "このスレッドを削除"
						},
						"style": "danger",
						"value": "deleteThisThred"
					}
				]
			},
			{
			"type": "image",
			"image_url": img_url,
			"alt_text": getTodayLabel()
			}
		]
	}
	console.log("마지막 리플라이")
	await bot.reply(message, reply_with_attachments)
});


controller.hears(['勤怠登録'], botScope, async(bot, message) => {
	var vacationArrayFtH = message.text.replace(/　/g," ");
	var vacationArrayNL = vacationArrayFtH.split('\n')
	var vacationArray = vacationArrayNL[0].split(' ')
	// var {stdout} = shell.exec(`jq -r .${message.user} ./config/userName.json | tr -d '\n'`)	
	// var userRealName=stdout
	var userRealName="<@"+message.user+">"
	if (vacationArray[1] == "help"){
		await bot.replyInThread(message,"使い方→@bot 勤怠登録or勤務登録　YYYY-MM-DD　自由入力or削除");
		return;
	}
	
	if(!date_pattern .test(vacationArray[1])){
		await bot.replyInThread(message,vacationArray[1]+":point_left:これは正しい日付ではありません。\n正しく入力してください。:japanese_ogre:");
		return;
	}

	if(!office_pattern .test(vacationArray[2])){
		await bot.replyInThread(message,"TSC、MM、HOME、VACのみの入力でお願いします。");
		return;
	}
	
	if (vacationArray[0] != undefined && vacationArray[1] != undefined && vacationArray[2] == "削除"){
		const sqlDelete = fs.readFileSync('./src/db/sql/deleteTimeNotOnWork.sql').toString();
		connection.query(sqlDelete,[userRealName, vacationArray[1]], function (error, results, fields) {
		  if (error) {throw error;}
		});
		await bot.replyInThread(message,vacationArray[1]+"の勤怠は削除しました。");
		return;
	}
	
	if (vacationArray[0] != undefined && vacationArray[1] != undefined && vacationArray[2] != undefined){	
		const sqlCount = fs.readFileSync('./src/db/sql/selectTimeNotOnWorkCount.sql').toString();
		connection.query(sqlCount,[userRealName, vacationArray[1]], function (error, results, fields) {
		  if (error) {throw error;}
		  var selectCount = results[0].count
		  sqlInsert(selectCount);
		});
		
		async function sqlInsert (selectCount){
			console.log("SQLINSERT들어옴")
			if (selectCount != 0){
				const sqlUpdate = fs.readFileSync('./src/db/sql/updateTimeNotOnWork.sql').toString();
				connection.query(sqlUpdate,[vacationArray[1],vacationArray[2],userRealName, vacationArray[1]], function (error, results, fields) {
				if (error) {throw error;}
				console.log('SQL結果',results);
				});
				await bot.replyInThread(message, vacationArray[1]　+ "はすでに登録されているためUpdateしました。");
			}else{
				const sqlInsert = fs.readFileSync('./src/db/sql/insertTimeNotOnWork.sql').toString();
				connection.query(sqlInsert,[userRealName, vacationArray[1],userRealName,vacationArray[2]], function (error, results, fields) {
				if (error) {throw error;}
				console.log('SQL結果',results);
				});
				await bot.replyInThread(message, vacationArray[1] + "は"+ vacationArray[2] +"で登録しました。");
			}
		};
		await new Promise(resolve => setTimeout(() => resolve(), 1000));
	}else{
		console.log("에러출력");
		console.log(vacationArray[0]);
		console.log(vacationArray[1]);
		console.log(vacationArray[2]);
		await bot.reply(message, '正しく書いてね。\n@bot 勤怠登録or勤務登録　YYYY-MM-DD 自由入力or削除');
	}
});


controller.hears(['TSC','MM','HOME','VAC','delete','deleteThisThred'],'block_actions', async(bot, message) => { 
	console.log(message)
	if (message.text == 'deleteThisThred'){
		await bot.replyInteractive(message, "削除されたスレッドです。");
		return;
	}
	
	
	var dateTodayArray = message.message.text.split(' ')
	var dateToday = dateTodayArray[1]

	var userRealName="<@"+message.user+">"
	
	const sqlCount = fs.readFileSync('./src/db/sql/selectTimeNotOnWorkCount.sql').toString();
		connection.query(sqlCount,[userRealName, dateToday], function (error, results, fields) {
		  if (error) {throw error;}
		  var selectCount = results[0].count
		  sqlInsert(selectCount);
		});
	
	async function sqlInsert (selectCount){
		console.log("SQL들어옴")
		if(selectCount != 0 && message.text == 'delete'){
			console.log("SQLDELETE들어옴")
			const sqlDelete = fs.readFileSync('./src/db/sql/deleteTimeNotOnWork.sql').toString();	
			connection.query(sqlDelete,[userRealName, dateToday], function (error, results, fields) {
			if (error) {throw error;}
			console.log('SQL結果',results);
			});
			await bot.replyEphemeral(message, dateToday　+ "の勤怠情報はDeleteしました。");
		 }else if(selectCount == 0 && message.text == 'delete'){
			console.log("SQLDELETEFAIL들어옴")
			await bot.replyEphemeral(message, dateToday　+ "の勤怠情報は登録されていないです。");	
			return;
		 }else if (selectCount != 0){
			console.log("SQLUPDATE들어옴")
			const sqlUpdate = fs.readFileSync('./src/db/sql/updateTimeNotOnWork.sql').toString();
			connection.query(sqlUpdate,[dateToday,message.text,userRealName, dateToday], function (error, results, fields) {
			if (error) {throw error;}
			console.log('SQL結果',results);
			});
			await bot.replyEphemeral(message, dateToday　+ "はすでに登録されているためUpdateしました。");
		}else{
			console.log("SQLINSERT들어옴")
			const sqlInsert = fs.readFileSync('./src/db/sql/insertTimeNotOnWork.sql').toString();
			connection.query(sqlInsert,[userRealName, dateToday,userRealName,message.text ], function (error, results, fields) {
			if (error) {throw error;}
			console.log('SQL結果',results);
			});
			await bot.replyEphemeral(message, dateToday + "は"+ message.text +"で登録しました。");
		}
	
	Slackresult();
	};
	
	await new Promise(resolve => setTimeout(() => resolve(), 1000));
	
	async function Slackresult(){
	console.log("쉘 실행전")
	var dateTodayForAll ="'"+dateToday+"';";
	var SQLSelectTSC = fs.readFileSync('./src/db/sql/selectTimeNotOnWorkTSC.sql').toString();
	SQLSelectTSC=SQLSelectTSC+dateTodayForAll
	var { stdout, stderr, err } = shell.exec(`mysql -u ${db.user} -p${db.password} -D ${db.database} -e "${SQLSelectTSC}" | sed 's/'name'/''/g' | sed 's/'location'/''/g'`)
	var SQLResultTSC =stdout
	console.log(SQLResultTSC)
	
	var SQLSelectMM = fs.readFileSync('./src/db/sql/selectTimeNotOnWorkMM.sql').toString();
	SQLSelectMM=SQLSelectMM+dateTodayForAll
	var { stdout, stderr, err } = shell.exec(`mysql -u ${db.user} -p${db.password} -D ${db.database} -e "${SQLSelectMM}" | sed 's/'name'/''/g' | sed 's/'location'/''/g'`)
	var SQLResultMM =stdout
	console.log(SQLResultMM)
	
	var SQLSelectHOME = fs.readFileSync('./src/db/sql/selectTimeNotOnWorkHOME.sql').toString();
	SQLSelectHOME=SQLSelectHOME+dateTodayForAll
	var { stdout, stderr, err } = shell.exec(`mysql -u ${db.user} -p${db.password} -D ${db.database} -e "${SQLSelectHOME}" | sed 's/'name'/''/g' | sed 's/'location'/''/g'`)
	var SQLResultHOME =stdout
	console.log(SQLResultHOME)
	
	var SQLSelectVAC = fs.readFileSync('./src/db/sql/selectTimeNotOnWorkVAC.sql').toString();
	SQLSelectVAC=SQLSelectVAC+dateTodayForAll
	var { stdout, stderr, err } = shell.exec(`mysql -u ${db.user} -p${db.password} -D ${db.database} -e "${SQLSelectVAC}" | sed 's/'name'/''/g' | sed 's/'location'/''/g'`)
	var SQLResultVAC =stdout
	console.log(SQLResultVAC)
	
	if (SQLResultTSC == ""){SQLResultTSC="`なし`"};
	if (SQLResultMM == ""){SQLResultMM="`なし`"};
	if (SQLResultHOME == ""){SQLResultHOME="`なし`"};
	if (SQLResultVAC == ""){SQLResultVAC="`なし`"};
		
	var week = new Array('sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat');
	var today = new Date(dateToday).getDay();
	var dayOfTheWeekArray = week[today];
	if (dayOfTheWeekArray == "mon"){
		img_url=img_url_mon
		dayOfTheWeek="月"
	}else if(dayOfTheWeekArray == "tue"){
		img_url=img_url_tue
		dayOfTheWeek="火"
	}else if(dayOfTheWeekArray == "wed"){
		img_url=img_url_wed
		dayOfTheWeek="水"
	}else if(dayOfTheWeekArray == "thu"){
		img_url=img_url_thu
		dayOfTheWeek="木"
	}else if(dayOfTheWeekArray == "fri"){
		img_url=img_url_fri
		dayOfTheWeek="金"
	}else if(dayOfTheWeekArray == "sat"){
		img_url=img_url_sat
		dayOfTheWeek="土"
	}else if(dayOfTheWeekArray == "sun"){
		img_url=img_url_sun
		dayOfTheWeek="日"
	}else if(dayOfTheWeekArray == "test"){
		img_url="https://lenarang.com/wp-content/uploads/2019/02/hwayoil.png"	 
	}
	
	
	var reply_with_attachments = {
		"channel": message.channel,
		"text": '勤怠管理 '+dateToday,
				"blocks": [
			{
				"type": "section",
				"text": {
					"type": "mrkdwn",
					"text": "*「"+dateToday+"("+dayOfTheWeek+")"+"」の勤怠*"
				},
				"accessory": {
					"type": "button",
					"text": {
						"type": "plain_text",
						"emoji": true,
						"text": "削除"
					},
					"style": "danger",
					"value": "delete"
				},
			},
			{
				"type": "divider"
			},
			{
				"type": "section",
				"text": {
					"type": "mrkdwn",
					"text": "*TSC*:office:\n勤務"
				},
				"accessory": {
					"type": "button",
					"text": {
						"type": "plain_text",
						"emoji": true,
						"text": "TSC"
					},
					"value": "TSC"
				}
			},
			{
				"type": "context",
				"elements": [
					{
						"type": "mrkdwn",
						"text": SQLResultTSC
					}
				]
			},
			{
				"type": "divider"
			},		
			{
				"type": "section",
				"text": {
					"type": "mrkdwn",
					"text": "*MM*:office:\n勤務"
				},
				"accessory": {
					"type": "button",
					"text": {
						"type": "plain_text",
						"emoji": true,
						"text": "MM"
					},
					"value": "MM"
				}
			},
			{
				"type": "context",
				"elements": [
					{
						"type": "mrkdwn",
						"text": SQLResultMM
					}
				]
			},
			{
				"type": "divider"
			},		
			{
				"type": "section",
				"text": {
					"type": "mrkdwn",
					"text": "*在宅*:house:\n勤務"
				},
				"accessory": {
					"type": "button",
					"text": {
						"type": "plain_text",
						"emoji": true,
						"text": "HOME"
					},
					"value": "HOME"
				}
			},
			{
				"type": "context",
				"elements": [
					{
						"type": "mrkdwn",
						"text": SQLResultHOME
					}
				]
			},
			{
				"type": "divider"
			},		
			{
				"type": "section",
				"text": {
					"type": "mrkdwn",
					"text": "*休み*:sunglasses:"
				},
				"accessory": {
					"type": "button",
					"text": {
						"type": "plain_text",
						"emoji": true,
						"text": "VAC"
					},
					"value": "VAC"
				}
			},
			{
				"type": "context",
				"elements": [
					{
						"type": "mrkdwn",
						"text": SQLResultVAC
					}
				]
			},
			{
				"type": "divider"
			},
					{
				"type": "actions",
				"elements": [
									{
						"type": "button",
						"text": {
							"type": "plain_text",
							"emoji": true,
							"text": "このスレッドを削除"
						},
						"style": "danger",
						"value": "deleteThisThred"
					}
				]
			},
			{
			"type": "image",
			"image_url": img_url,
			"alt_text": getTodayLabel()
			}
		]
	}
	console.log("마지막 리플라이")
	
	await bot.replyInteractive(message, reply_with_attachments)
	}
});
//회사

//테스트
controller.hears(['test'], botScope, async(bot, message) => {
	console.log(new Date().getDay())
});


//예외
controller.hears(['(.*)'], botScope, async(bot, message) => { 
	var notYet = message.text;
	console.log(notYet);
    await bot.replyEphemeral(message,'「'+notYet+'」←こんなのはありません。\n機能を確認するためには@bot help');
});
//예외


// cron.schedule('*/1 * * * *', async function(){
// 	console.log('Cron起動');
//   	controller.on('*', async(bot, message) => { 
// 		console.log('CronController');
// 		 await bot.reply(message,'CronTest');
// 	});
// }, {
//    scheduled: true,
//    timezone: "Asia/Seoul"
// });

// controller.on(async(bot, message) =>{
// 	new cron.CronJob({'*/1 * * * *',onTick: () => {await bot.say({channel: 'random',text: ':smiley: おはようございます！'});
// 	 },
//         start: true,
//         timeZone: 'Asia/Tokyo'
//     });
// })

// controller.spawn({
//     token : process.env.token
// }).startRTM((err, bot, payload) => {
//     new cron.CronJob({
//         cronTime: '00 00 09 * * 1-5',
//         onTick: () => {
//             bot.say({
//                 channel: 'random',
//                 text: ':smiley: おはようございます！'
//             });
//         },
//         start: true,
//         timeZone: 'Asia/Tokyo'
//     });
// });


