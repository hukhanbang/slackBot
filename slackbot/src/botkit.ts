const { Botkit,BotkitConversation } = require('botkit');
const { SlackAdapter, SlackEventMiddleware,SlackMessageTypeMiddleware  } = require('botbuilder-adapter-slack');
var shell = require('shelljs');
import CONFIG from '../config/bot.json';
var moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");
let request = require('request');
let cheerio = require('cheerio');


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
	'direct_message',
	'direct_mention',
	'mention'
];



controller.hears(['わからないな'], botScope, async(bot, message) => {
	console.log(message);
	console.log(message.text);
	await bot.reply(message, 'ボット');
});

controller.hears(['今日は何の日'], botScope, async(bot, message) => {
	const { stdout, stderr, err } = shell.exec('./shell/whattoday.sh')
	console.log(stdout);
	await bot.reply(message, stdout);
});

controller.hears(['休み','勤怠'], botScope, async(bot, message) => {
	console.log(message);
	console.log(message.text);
	
	var vacationArray = message.text.split(' ')
	console.log('첫번째');
	console.log(vacationArray[0]);
	console.log('두번째');
	console.log(vacationArray[1]);
	
	if (vacationArray[1] == '月' || vacationArray[1] == '火' || vacationArray[1] == '水' || vacationArray[1] == '木' || vacationArray[1] == '金' || vacationArray[1] == '月曜日' || vacationArray[1] == '火曜日' || vacationArray[1] == '水曜日' || vacationArray[1] == '木曜日' || vacationArray[1] == '金曜日'){
		console.log('pass');
	}else{
		var vacationArray = message.text.split('　')
		console.log('세번째');
		console.log(vacationArray[0]);
		console.log('네번째');
		console.log(vacationArray[1]);
	}
	
	if (vacationArray[1] == '月' || vacationArray[1] == '火' || vacationArray[1] == '水' || vacationArray[1] == '木' || vacationArray[1] == '金' || vacationArray[1] == '月曜日' || vacationArray[1] == '火曜日' || vacationArray[1] == '水曜日' || vacationArray[1] == '木曜日' || vacationArray[1] == '金曜日'){
		var workToSlack = vacationArray[1] + 'の休みで登録したよ'
		await bot.reply(message, workToSlack);
	}else{
		await bot.reply(message, '正しく書いてね。');
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
	await bot.reply(message,SlackStdout);
});


//ぐるなび
const DIALOG_ID = 'gurunavi';
const gurunaviConv = new BotkitConversation(DIALOG_ID, controller);
const keyid = CONFIG.GurunaviKEY;
var result = '';

gurunaviConv.say('ぐるなびテスト');
gurunaviConv.ask('食べたいもの入力して（とんかつ、ラーメンなど）',async(response, convo, bot)=>{
	gurunaviConv.say(`OK ${response} で調べる`);
	// await convo.gotoThread('has_hours');
	var encodegurunavi = encodeURIComponent( response )
	var URL = 'https://api.gnavi.co.jp/RestSearchAPI/v3/?keyid=' + keyid + '&name=' + encodegurunavi
	request.get({
		uri : URL
	},function(err,res,body){
		var jData = JSON.parse(body);
		var jerror = JSON.parse(err);
		if(err){
			console.log('에러발생');
			console.log(err);
		}else{
			jData["rest"].forEach(function(item){
				result = result + item.name 
			});
			result = result.split(" ").join("\n")
			// console.log(result);	
			gurunaviConv.say(URL);
		}	
	});
  }, {key: 'name'});;


controller.addDialog(gurunaviConv);

controller.ready(() => {
  controller.hears(['ぐるなび'], botScope, async (bot, message) => {
    await bot.beginDialog(DIALOG_ID);
  });
});
//ぐるなび





// controller.hears(['(.*)'], botScope, async(bot, message) => { 
// 	var notYet = message.text;
// 	console.log(notYet);
//     await bot.reply(message,'「'+notYet+'」←こんなのはありません。');
// });
