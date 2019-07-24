const request = require('request');
const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs');

let currentChannel = null;
let currentAuthor = null;

const MERCHANDISE_BOT_API_KEY = null; // your api key here
const operatingChannel = "575955571514015754";	// no use for this.. dont remove
const clearEnabled = true;
const refreshEnabled = true;

let prizes = {}

client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);

	updatePrizes();
	setInterval(updatePrizes, 30 * 1000);
});

client.on('message', msg => {
	let txt = msg.content;
	const isDM = msg.guild === null;

	currentChannel = msg.channel;
	currentAuthor = msg.author.id;

	// if (currentChannel.id != operatingChannel) {	return;		}

	if (txt.startsWith('-help')) {
		reply(`I understand these commands:'''
-help          - displays this message

-items         - displays a list of all items
-item #        - gives more information for an item by the given id

-remove #      - removes the given item (you have to be the seller to do this)
-price # <new> - Sets a new price for the given item (you have to be the seller to do this)


In order to add an item just send a formatted message:

-Title (can be with spaces)
-Description
can be multi line
-<price> TRTL'''
Made by fipsi#0789 - If you have any questions, he can help you
Hosted by DroppingThePacketsHard#1822 - If the bot is down, ping him
			`);
			return;
	}
	if (txt.startsWith('-items')) {
		fs.readFile('items.json', 'utf8', (err, data) => {
			if (err) { reply('Oops... An error occured... Please try again later'); }
			else {
				data = JSON.parse(data);
				let finalMessage = (Object.keys(data).length > 0 ? "All items in our shop:\n" : "There are currently no items in our shop...");
				for (id in data) {
					finalMessage += `\n**${data[id].title} - #${id}**`;
				};
				finalMessage += (Object.keys(data).length > 0 ? "\n\nType `-item <id>` to view more details for an item" : "");
				reply(finalMessage);
			}
		});
		return;
	}
	if (txt.startsWith('-item')) {
		let itemId = txt.split(' ')[1];
		if (!itemId) {
			reply('Please specify an id: `-item <id>`');
			return;
		} else {
			itemId = itemId.replace('#', '');
		}
		fs.readFile('items.json', 'utf8', (err, data) => {
			if (err) { reply('Oops... An error occured... Please try again later') }
			else {
				data = JSON.parse(data);
				if (itemId in data) {
					let item = data[itemId];
					reply(`**${item.title} - #${itemId}**\n\n${item.description}\nPrice: ${getTrtlPrice(item.price)} TRTL\nSeller: <@${item.author}>. Ping him/her for more information`);
				} else {
					reply('I couldn\'t find this id.. Are you sure you entered it correctly?');
				}
			}
		});
		return;
	}
	if (txt.startsWith('-clear') && clearEnabled) {
		msg.channel.fetchMessages()
			.then((messages) => {
				messages = messages.array();
				for (let i = 0; i < messages.length; i++) {
					messages[i].delete();
				}
			});
		return;
	}
	if (txt.startsWith('-remove') || txt.startsWith('-delete')) {
		let id = txt.split(' ')[1];
		if (!id) {
			reply('Please specify an id to delete: `-delete <id to delete>`');
		} else {
			fs.readFile('items.json', 'utf8', (err, data) => {
				if (err) { reply('Ooops... Something went wrong.. Please try again!'); }
				else {
					data = JSON.parse(data);
					if (id in data) {
						if (data[id].author == currentAuthor) {
							currentChannel.fetchMessage(data[id].msgId)
								.then((message) => {
									message.delete()
									.then((unreferencedMessage) => {
										delete data[id];
										msg.delete();
										reply('Item **#' + id + '** got removed by seller.');
										fs.writeFile('items.json', JSON.stringify(data, null, 4), () => {});
									})
									.catch((err) => {});
								}).catch((err) => {
									reply('I couldn\'t delete the item because the old message got deleted..');
								})
						} else {
							reply('You can\'t delete this item because you\'re not the seller!');
						}
					} else {
						reply('The given id is not registered in our store.. Please make sure you entered it correctly!');
					}
				}
			})
		}
		return;
	}
	if (txt.startsWith('-price')) {
		const [ unformattedId, newPrice ] = txt.split(' ').slice(1, 3);
		if (unformattedId && newPrice) {
			const formattedPrice = parseFloat(newPrice.replace('TRTL', '').trim());
			const id = unformattedId.replace('#', '');

			if (isNaN(formattedPrice) || formattedPrice <= 0) {
				reply('Please enter a valid price...');
				return;
			}

			fs.readFile('items.json', 'utf8', (err, data) => {
				if (err) { reply('Ooops.. Something went wrong.. Please try again!'); }
				else {
					data = JSON.parse(data);
					if (id in data) {
						const oldPrice = data[id].price;
						if (data[id].author == msg.author.id) {
							data[id].price = formattedPrice;
							msg.channel.fetchMessage(data[id].msgId)
								.then((message) => {
									let contents = message.content;
									message.edit(
										contents.replace(oldPrice + ' TRTL', data[id].price + ' TRTL')
									).then(()=>{}).catch(()=>{});
								})
								.catch((err)=>{});
							fs.writeFile('items.json', JSON.stringify(data, null, 4), (err) => {} );
							reply('The new price for item **#' + id + '** is ' + formattedPrice + ' TRTL');
							msg.delete();
						} else {
							reply('You can\'t change the price of this item because you\'re not the seller..');
						}
					} else {
						reply('I couldn\' find this item.. Are you sure you entered the id correctly?');
					}
				}
			});
		} else {
			reply('Please specify an id and a new price: `-price #<old id> <new price> TRTL`');
		}

		return;
	}
	if (txt.startsWith('-refresh') && refreshEnabled) {
		updatePrizes();
		return;
	}
	if (txt.startsWith('-')) {
		let parts = txt.split('-');
		if (parts[0] == '') {
			parts.splice(0, 1);
		}

		const title = parts[0];
		const description = parts[1];
		let   formattedPrice = parts[2].toUpperCase();

		if (!title || !description || !formattedPrice) {
			reply(`I couldn\'t parse this item because your message was malformatted. Please send a message formatted like this:'''
-Title (can be with spaces)
-Description
can be multi line
-<price> TRTL'''`);
			return;
		}

		if (formattedPrice.indexOf("USD") > -1 || formattedPrice.indexOf("EUR") > -1) {
			if (!isDM) {
				msg.delete();
				msg.author.send(":ban: :joy: Please don't send a USD or EUR price in the Turtlecoin discord! There is a own market talk server linked in #market-talk.\nIf you want to list a product with a fiat price, you can DM me and change the TRTL amount to a USD, EUR equivalent!\nThanks for your understanding ;)");
				return;
			}
		}

		newItemId((id) => {
			fs.readFile('items.json', 'utf8', (err, data) => {
				if (err) { reply('Something went wrong... Please try again!') }
				else {
					data = JSON.parse(data);
					if (id in data) { reply('Something went wrong... Please try again!'); }
					else {
						if (isNaN(parseFloat(formattedPrice))) {
							reply('The price you entered is not formatted correctly.. Please try again!');
							return;
						}
						let msgId = null;
						let finalPrice = formattedPrice;
						console.log(finalPrice, formattedPrice, prizes);
						if (isDM) {
							finalPrice = getTrtlPrice(formattedPrice);

							/* legacy - dont remove */
							// let currency = "";
							// if (formattedPrice.indexOf("USD") > -1) {
							// 	finalPrice = parseFloat(finalPrice.replace("USD", "").trim()) / prizes["usd"];
							// } else if (formattedPrice.indexOf("EUR") > -1) {
							// 	finalPrice = parseFloat(finalPrice.replace("EUR", "").trim()) / prizes["eur"];
							// } else if (formattedPrice.indexOf("TRTL")) {
							// 	finalPrice = parseFloat(formattedPrice.replace("TRTL", "").trim());
							// }
							// if (isNaN(finalPrice)) {
							// 	reply("The price you entered isn't valid...");
							// }
							/* legacy end */

							currentChannel = client.channels.get(operatingChannel);
						}
						reply(`**${title.replace('\n', '')} - #${id}**

${description}
Price: ${finalPrice} TRTL
Seller: <@${currentAuthor}>. Ping him/her for more information.`, true, (mId) => {
							data[id] = {
								author: msg.author.id,
								title: title.replace('\n', ''),
								description: description,
								price: formattedPrice,
								msgId: mId
							}
							fs.writeFile('items.json', JSON.stringify(data, null, 4), (err) => {
								msg.delete();
							});
						});
					}
				}
			});
		});
	}
});

client.login(MERCHANDISE_BOT_API_KEY);

function getTrtlPrice(formatd) {
	formatd = formatd.toUpperCase();
	let price = 0;
	if (formatd.indexOf("USD") > -1) {
		price = parseFloat(formatd.replace("USD", "").trim()) / prizes["usd"];
	} else if (formatd.indexOf("EUR") > -1) {
		price = parseFloat(formatd.replace("EUR", "").trim()) / prizes["eur"];
	} else if (formatd.indexOf("TRTL") > -1) {
		price = parseFloat(formatd.replace("TRTL", "").trim());
	}
	return (isNaN(price) ? 0 : formatMoney(price, 2, ".", ","));
}
function updatePrizes() {
	get("https://api.coingecko.com/api/v3/simple/price?ids=turtlecoin&vs_currencies=usd,eur", function (data) {
		console.log("Price:", data);
		if (data !== false) {
			data = JSON.parse(data);
			prizes = data["turtlecoin"];
			fs.readFile("items.json", "utf8", (err, data) => {
				if (err) {  }
				data = JSON.parse(data);
				for (itemId in data) {
					let item = data[itemId];
					client.channels.get(operatingChannel).fetchMessage(item.msgId).then((message) => {
						let content = message.content;

						message.edit(
							content.replace(/([0-9., ]{2,}TRTL)/gi, " " + getTrtlPrice(item.price) + " TRTL")
						).then((msg)=>{}).catch((err)=>{})
					}).catch((err) => {});
				}
			})
		}
	})
}
function get(url, cb) {
	request.get(url, null, function (err, res, body) {
	  if (err) { cb(false); }
	  else {
		  if (res.statusCode !== 200){
			  cb(false);
		  } else {
			  cb(body);
		  }
	  }
	});
}
function newItemId(cb) {
	let itemId = generateItemId();
	itemIdExists(itemId, (exists) => {
		if (exists) {
			newItemId(cb);
		} else {
			cb(itemId);
		}
	});
}
function itemIdExists(id, cb) {
	fs.readFile('items.json', 'utf8', (err, data) => {
		if (err) { cb(true); }
		else {
			data = JSON.parse(data);
			cb(id in data);
		}
	});
}
function generateItemId() {
   var result           = '';
   var characters       = '0123456789';
   var charactersLength = characters.length;
   for (var i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}
function reply(text, pinMessage, msgIdCb) {
	text = text.replace(/'''/g, '```').replace(/\r/g, '');
	currentChannel.send(text)
		.then((message) => {
			if (pinMessage) {
				message.pin();
			}
			if (msgIdCb) {
				msgIdCb(message.id);
			}
		})
		.catch(console.error);
}
function formatMoney(amount, decimalCount = 2, decimal = ".", thousands = ",") {
  try {
    decimalCount = Math.abs(decimalCount);
    decimalCount = isNaN(decimalCount) ? 2 : decimalCount;

    const negativeSign = amount < 0 ? "-" : "";

    let i = parseInt(amount = Math.abs(Number(amount) || 0).toFixed(decimalCount)).toString();
    let j = (i.length > 3) ? i.length % 3 : 0;

    return negativeSign + (j ? i.substr(0, j) + thousands : '') + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousands) + (decimalCount ? decimal + Math.abs(amount - i).toFixed(decimalCount).slice(2) : "");
  } catch (e) {
    console.log(e)
  }
};
