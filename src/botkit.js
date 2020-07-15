const { Botkit,BotkitConversation } = require('botkit');
const { SlackAdapter, SlackEventMiddleware,SlackMessageTypeMiddleware  } = require('botbuilder-adapter-slack');
var shell = require('shelljs');
var CONFIG = require('../config/bot.json');
var UN = require('../config/userName.json');
var fs = require('fs')
var mysql = require('mysql')
var moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");
let request = require('request');
var db = require('./db/db.js');
var connection = mysql.createConnection(db);
const keyid = CONFIG.GurunaviKEY




const adapter = new SlackAdapter({
  clientSigningSecret: CONFIG.SIGNING_SECRET,
  botToken: CONFIG.BOT_USER_OAUTH_ACCESS_TOKEN
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
	'direct_message'
	
];


controller.hears(['help','使い方'], botScope, async(bot, message) => {
	var manual="@bot ぐるなび\n@bot 今日は何の日\n@bot 勤怠or休み　YYYY-MM-DD　TSCorMMorHOMEor休み\n@bot 時間or時刻\n@bot covid\n@bot 休み状況or勤怠状況"
	await bot.reply(message, manual);
});

controller.hears(['今日は何の日'], botScope, async(bot, message) => {
	const { stdout, stderr, err } = shell.exec('./shell/whattoday.sh')
	console.log(stdout);
	await bot.reply(message, stdout);
});




controller.hears(['休み状況','勤怠状況'], botScope, async(bot, message) => {
	const SQLSELECT = fs.readFileSync('./src/db/sql/selectTimeNotOnWork.sql').toString();
	var { stdout, stderr, err } = shell.exec(`mysql -u ${db.user} -p${db.password} -D ${db.database} -e "${SQLSELECT}" | sed 's/'name'/''/g' | sed 's/'location'/''/g'`)
	var sqlShell = stdout
	var { stdout } = shell.exec(`date '+%Y-%m-%d' | tr -d '\n'`)
	var dateShell = stdout
	console.log("JS LOG")
	console.log(dateShell)
	await bot.reply(message,"本日("+dateShell+")の勤務状況"+sqlShell)
});


controller.hears(['test'], botScope, async(bot, message) => {
	var {stdout} = shell.exec(`jq -r .${message.user} ./config/userName.json`)
	// console.log(message)
	// console.log("콘솔로그")
	console.log(stdout)
	await bot.reply(message,stdout)
});

controller.hears(['休み','勤怠'], botScope, async(bot, message) => {
	var vacationArrayFtH = message.text.replace(/　/g," ");
	var vacationArray = vacationArrayFtH.split(' ')
	var {stdout} = shell.exec(`jq -r .${message.user} ./config/userName.json | tr -d '\n'`)	
	var userRealName=stdout
	if (vacationArray[1] == "help"){
		await bot.reply(message,"使い方→@bot 休みor勤怠　YYYY-MM-DD　TSCorMMorHOMEor休み");
		return;
	}
	
	if (vacationArray[0] != undefined && vacationArray[1] != undefined && vacationArray[2] == "削除"){
		const sqlDelete = fs.readFileSync('./src/db/sql/deleteTimeNotOnWork.sql').toString();
		connection.query(sqlDelete,[userRealName, vacationArray[1]], function (error, results, fields) {
		  if (error) {throw error;}
		});
		await bot.reply(message,vacationArray[1]+"の勤怠は削除しました。");
		return;
	}
	
	if (vacationArray[0] != undefined && vacationArray[1] != undefined && vacationArray[2] != undefined){	
		
		var workToSlack = vacationArray[1] + 'は休みで登録したよ'
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
				await bot.reply(message, vacationArray[1]　+ "はすでに登録されているためUpdateしました。");
			}else{
				const sqlInsert = fs.readFileSync('./src/db/sql/insertTimeNotOnWork.sql').toString();
				connection.query(sqlInsert,[userRealName, vacationArray[1],userRealName,vacationArray[2]], function (error, results, fields) {
				if (error) {throw error;}
				console.log('SQL結果',results);
				});
				await bot.reply(message, vacationArray[1] + "は"+ vacationArray[2] +"で登録しました。");
			}
		};
		await new Promise(resolve => setTimeout(() => resolve(bot.reply(message, "処理完了")), 1000));
	}else{
		await bot.reply(message, '正しく書いてね。\n@bot 休みor勤怠　YYYY-MM-DD TSCorMMorHOMEor休み');
	}
});





controller.hears(['時間','time','時刻'], botScope, async(bot, message) => { 
	let SlackTime = moment().format("YYYY年MM月DD日 HH:mm:ss dddd");
	console.log(SlackTime);
    await bot.reply(message,SlackTime);
});


controller.hears(['コロナ','covid','코로나','corona'], botScope, async(bot, message) => { 
	const { stdout, stderr, err } = shell.exec('./shell/covid19.sh trigger')
	console.log(stdout);
	var stdoutArray = stdout.split('\n')
	var SlackStdout = stdoutArray[3] + '\n' + stdoutArray[4];
	
	console.log("세번쨰");
	console.log(stdoutArray[3]);
	console.log("네번쨰");
	console.log(stdoutArray[4]);
	await bot.reply(message,SlackStdout);
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
	const { stdout, stderr, err } = shell.exec(`./shell/gurunavi.sh ${keyid} ${encodegurunavi} ${gurunaviText[2]}`)
	
	var stdoutArray = stdout.split('\n')
	// var stdoutArray_splice = stdoutArray.splice(0,4);
	var stdoutSlack = stdoutArray.join('\n')
	var stdoutSlack2 = stdoutSlack.replace(/["]/g, "")

	await bot.reply(message,stdoutSlack2);
});



controller.hears(['(.*)'], botScope, async(bot, message) => { 
	var notYet = message.text;
	console.log(notYet);
    await bot.reply(message,'「'+notYet+'」←こんなのはありません。\n機能を確認するためには@bot help');
});
