const request = require('request');
const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs');

let currentChannel = null;
let currentAuthor = null;

const MERCHANDISE_BOT_API_KEY = null; // your discord api key here
const operatingChannel = '575955571514015754';	// no use for this.. dont remove
const clearEnabled = true;
const refreshEnabled = true;
const embedColor = '#f2c409';

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
		replyWithEmbed(new Discord.RichEmbed()
			.setAuthor(client.user.tag)
			.setTitle('__**Help**__')
			.setFooter('Provided by fipsi#0789 and DroppingThePacketsHard²#4751')
			.setColor(embedColor)
			.addField('__Commands__', 'Commands to control me')
			.addField('-help', 'Displays this message')
			.addField('-items', 'Displays a list of all items')
			.addField('-item #', 'Gives more information for an item by the given id')
			.addField('-remove #', 'Removes the given item (you have to be the seller to do this)')
			.addField('-price # <new price>', 'Sets a new price **manually** for the given item (you have to be the seller to do this)')
			.addBlankField()
			.addField('__Usage__', `\`\`\`-Title (can be with spaces)
-Description
can be multi line
-<price> TRTL\`\`\``)
			.addBlankField()
			.addField('__Dynamic Price__', 'In order to use a dynamic price please send me a dm and replace `<price> TRTL` with the currency of your choice')
			.addBlankField()
			.addField('__Contact__', 'Report issues here')
			.addField('Maker', 'fipsi#0789 - If you have any questions, he can help you')
			.addField('Hoster', 'DroppingThePacketsHard²#4751 - If the bot is down, ping him')
		);
		return;
	}

	if (txt.startsWith('-items')) {
		fs.readFile('items.json', 'utf8', (err, data) => {
			if (err) {
				replyWithEmbed(new Discord.RichEmbed()
					.setAuthor(client.user.tag)
					.setTitle('__**Error**__')
					.setFooter('Provided by fipsi#0789 and DroppingThePacketsHard²#4751')
					.setColor('#FF0000')
					.setDescription('Oops...\nAn error occured...\nPlease try again later'));
			} else {
				data = JSON.parse(data);

				let description = (Object.keys(data).length > 0 ? 'Type `-item <id>` to view more details for an item\n' : '');
				description += (Object.keys(data).length > 0 ? 'All items in our shop:\n' : 'There are currently no items in our shop...');

				let embed = new Discord.RichEmbed()
					.setAuthor(client.user.tag)
					.setTitle('__**List of all items**__')
					.setFooter('Provided by fipsi#0789 and DroppingThePacketsHard²#4751')
					.setColor(embedColor)
					.setDescription(description);

				if (Object.keys(data).length < 25) {
					for (id in data) {
						let userTag = '';

						client.guilds.every((guild) => {
							let member = guild.members.find(member => member.id === data[id].author);
							userTag = member.user.tag;
						});

						embed.addField(`**'${data[id].title}' by ${userTag}**`, `ID: #${id}`);
					};
				}
				replyWithEmbed(embed);
			}
		});
		return;
	}

	if (txt.startsWith('-item')) {
		let itemId = txt.split(' ')[1];

		if (!itemId) {
			replyWithEmbed(new Discord.RichEmbed()
				.setAuthor(client.user.tag)
				.setTitle('__**Error**__')
				.setFooter('Provided by fipsi#0789 and DroppingThePacketsHard²#4751')
				.setColor('#FF0000')
				.setDescription('Please specify an id: `-item <id>`'));
			return;
		} else {
			itemId = itemId.replace('#', '');
		}

		fs.readFile('items.json', 'utf8', (err, data) => {
			if (err) {
				replyWithEmbed(new Discord.RichEmbed()
					.setAuthor(client.user.tag)
					.setTitle('__**Error**__')
					.setFooter('Provided by fipsi#0789 and DroppingThePacketsHard²#4751')
					.setColor('#FF0000')
					.setDescription('Oops...\nAn error occured...\nPlease try again later'));
			} else {
				data = JSON.parse(data);

				if (itemId in data) {
					let item = data[itemId];
					let userTag = '';

					client.guilds.every((guild) => {
						let member = guild.members.find(member => member.id === item.author);
						userTag = member.user.tag;
					});

					replyWithEmbed(new Discord.RichEmbed()
						.setAuthor(userTag)
						.setTitle(`__**Item ${itemId}**__`)
						.setFooter('Provided by fipsi#0789 and DroppingThePacketsHard²#4751')
						.setColor(embedColor)
						.setDescription('Ping the seller for more information!')
						.addField('Title', item.title)
						.addField('ID', itemId)
						.addField('Description', item.description)
						.addField('Price', `${getTrtlPrice(item.price)} TRTL`));
				} else {
					replyWithEmbed(new Discord.RichEmbed()
						.setAuthor(client.user.tag)
						.setTitle('__**Error**__')
						.setFooter('Provided by fipsi#0789 and DroppingThePacketsHard²#4751')
						.setColor('#FF0000')
						.setDescription('I couldn\'t find this id.. Are you sure you entered it correctly?'));
				}
			}
		});
		return;
	}

	if (txt.startsWith('-clear') && clearEnabled) {
		msg.channel.fetchMessages()
			.then((messages) => {
				messages.every((msg) => msg.delete());
			});
		return;
	}

	if (txt.startsWith('-remove') || txt.startsWith('-delete')) {
		let id = txt.split(' ')[1];

		id = id.replace('#', '');

		if (!id) {
			replyWithEmbed(new Discord.RichEmbed()
				.setAuthor(client.user.tag)
				.setTitle('__**Error**__')
				.setFooter('Provided by fipsi#0789 and DroppingThePacketsHard²#4751')
				.setColor('#FF0000')
				.setDescription('Please specify an id to delete: `-delete <id to delete>`'));
		} else {
			fs.readFile('items.json', 'utf8', (err, data) => {
				if (err) {
					replyWithEmbed(new Discord.RichEmbed()
						.setAuthor(client.user.tag)
						.setTitle('__**Error**__')
						.setFooter('Provided by fipsi#0789 and DroppingThePacketsHard²#4751')
						.setColor('#FF0000')
						.setDescription('Oops...\nAn error occured...\nPlease try again later'));
				} else {
					data = JSON.parse(data);
					if (id in data) {
						if (data[id].author == currentAuthor) {
							currentChannel.fetchMessage(data[id].msgId)
								.then((message) => {
									message.delete()
									.then((unreferencedMessage) => {
										delete data[id];
										msg.delete();

										replyWithEmbed(new Discord.RichEmbed()
											.setAuthor(client.user.tag)
											.setTitle(`__**Item #${id} removed!**__`)
											.setFooter('Provided by fipsi#0789 and DroppingThePacketsHard²#4751')
											.setColor(embedColor));

										fs.writeFile('items.json', JSON.stringify(data, null, 4), () => {});
									})
									.catch((err) => {});
								}).catch((err) => {
									replyWithEmbed(new Discord.RichEmbed()
										.setAuthor(client.user.tag)
										.setTitle('__**Error**__')
										.setFooter('Provided by fipsi#0789 and DroppingThePacketsHard²#4751')
										.setColor('#FF0000')
										.setDescription('I couldn\'t delete the item because the old message got deleted...'));
								})
						} else {
							replyWithEmbed(new Discord.RichEmbed()
								.setAuthor(client.user.tag)
								.setTitle('__**Error**__')
								.setFooter('Provided by fipsi#0789 and DroppingThePacketsHard²#4751')
								.setColor('#FF0000')
								.setDescription('You can\'t delete this item because you\'re not the seller!'));
						}
					} else {
						replyWithEmbed(new Discord.RichEmbed()
						.setAuthor(client.user.tag)
						.setTitle('__**Error**__')
						.setFooter('Provided by fipsi#0789 and DroppingThePacketsHard²#4751')
						.setColor('#FF0000')
						.setDescription('The given id is not registered in our store...\nPlease make sure you entered it correctly!'));
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
				replyWithEmbed(new Discord.RichEmbed()
					.setAuthor(client.user.tag)
					.setTitle('__**Error**__')
					.setFooter('Provided by fipsi#0789 and DroppingThePacketsHard²#4751')
					.setColor('#FF0000')
					.setDescription('Please enter a valid price!'));
				return;
			}

			fs.readFile('items.json', 'utf8', (err, data) => {
				if (err) {
					replyWithEmbed(new Discord.RichEmbed()
						.setAuthor(client.user.tag)
						.setTitle('__**Error**__')
						.setFooter('Provided by fipsi#0789 and DroppingThePacketsHard²#4751')
						.setColor('#FF0000')
						.setDescription('Oops...\nAn error occured...\nPlease try again later'));
				} else {
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

							replyWithEmbed(new Discord.RichEmbed()
								.setAuthor(client.user.tag)
								.setTitle(`__**Price for item #${id} updated**__`)
								.setFooter('Provided by fipsi#0789 and DroppingThePacketsHard²#4751')
								.setColor(embedColor)
								.addField('Old price', oldPrice)
								.addField('New price', formattedPrice));

							msg.delete();
						} else {
							replyWithEmbed(new Discord.RichEmbed()
								.setAuthor(client.user.tag)
								.setTitle('__**Error**__')
								.setFooter('Provided by fipsi#0789 and DroppingThePacketsHard²#4751')
								.setColor('#FF0000')
								.setDescription('You can\'t change the price of this item because you\'re not the seller...'));
						}
					} else {
						replyWithEmbed(new Discord.RichEmbed()
							.setAuthor(client.user.tag)
							.setTitle('__**Error**__')
							.setFooter('Provided by fipsi#0789 and DroppingThePacketsHard²#4751')
							.setColor('#FF0000')
							.setDescription('I couldn\'t find this item.. Are you sure you entered the id correctly?'));
					}
				}
			});
		} else {
			replyWithEmbed(new Discord.RichEmbed()
				.setAuthor(client.user.tag)
				.setTitle('__**Error**__')
				.setFooter('Provided by fipsi#0789 and DroppingThePacketsHard²#4751')
				.setColor('#FF0000')
				.setDescription('Please specify an id and a new price: `-price #<old id> <new price> TRTL`'));
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
		let formattedPrice = parts[2]

		if (!title || !description || !formattedPrice) {
			replyWithEmbed(new Discord.RichEmbed()
			.setAuthor(client.user.tag)
			.setTitle('__**Error**__')
			.setFooter('Provided by fipsi#0789 and DroppingThePacketsHard²#4751')
			.setColor('#FF0000')
			.setDescription(`I couldn\'t parse this item because your message was malformatted. Please send a message formatted like this:\`\`\`
-Title (can be with spaces)
-Description
can be multi line
-<price> TRTL\`\`\``));
			return;
		}

		formattedPrice = formattedPrice.toUpperCase();

		if (formattedPrice.indexOf('USD') > -1 || formattedPrice.indexOf('EUR') > -1) {
			if (!isDM) {
				msg.delete();
				replyWithEmbed(new Discord.RichEmbed()
					.setAuthor(client.user.tag)
					.setTitle('__**Error**__')
					.setFooter('Provided by fipsi#0789 and DroppingThePacketsHard²#4751')
					.setColor('#FF0000')
					.setDescription(':ban: :t_lol:\nPlease don\'t send a USD or EUR price in the Turtlecoin discord!\nThere is a own market talk server linked in #market-talk.\nIf you want to list a product with a fiat price, you can DM me and change the TRTL amount to a USD, EUR equivalent!\nThanks for your understanding ;)'));
				return;
			}
		}

		msg.author.send("Hi :wave: just wanted to tell you that you can also list an item with a fiat price which is kept updated accordingly to the current USD/EUR-TRTL conversion rate..\nIn order to do so just change the TRTL in the price to either USD or EUR..\n**This only works here, in the DMs** because of the no-market-talk rule ;)\n*Removing won't be possible via the bot, ping DroppingThePacketsHard²#4751 to remove the item.*");

		newItemId((id) => {
			fs.readFile('items.json', 'utf8', (err, data) => {
				if (err) {
					replyWithEmbed(new Discord.RichEmbed()
						.setAuthor(client.user.tag)
						.setTitle('__**Error**__')
						.setFooter('Provided by fipsi#0789 and DroppingThePacketsHard²#4751')
						.setColor('#FF0000')
						.setDescription('Oops...\nAn error occured...\nPlease try again later'));
				} else {
					data = JSON.parse(data);

					if (id in data) {
						replyWithEmbed(new Discord.RichEmbed()
							.setAuthor(client.user.tag)
							.setTitle('__**Error**__')
							.setFooter('Provided by fipsi#0789 and DroppingThePacketsHard²#4751')
							.setColor('#FF0000')
							.setDescription('Oops...\nAn error occured...\nPlease try again later'));
					} else {
						if (isNaN(parseFloat(formattedPrice))) {
							replyWithEmbed(new Discord.RichEmbed()
								.setAuthor(client.user.tag)
								.setTitle('__**Error**__')
								.setFooter('Provided by fipsi#0789 and DroppingThePacketsHard²#4751')
								.setColor('#FF0000')
								.setDescription('The price you entered is not formatted correctly...\nPlease try again!'));
							return;
						}

						let finalPrice = formattedPrice;
						console.log(finalPrice, formattedPrice, prizes);

						if (isDM) {
							finalPrice = getTrtlPrice(formattedPrice);

							/* legacy - dont remove */
							// let currency = '';
							// if (formattedPrice.indexOf('USD') > -1) {
							// 	finalPrice = parseFloat(finalPrice.replace('USD', '').trim()) / prizes['usd'];
							// } else if (formattedPrice.indexOf('EUR') > -1) {
							// 	finalPrice = parseFloat(finalPrice.replace('EUR', '').trim()) / prizes['eur'];
							// } else if (formattedPrice.indexOf('TRTL')) {
							// 	finalPrice = parseFloat(formattedPrice.replace('TRTL', '').trim());
							// }
							// if (isNaN(finalPrice)) {
							// 	reply('The price you entered isn't valid...');
							// }
							/* legacy end */

							currentChannel = client.channels.get(operatingChannel);
						}

						replyWithEmbed(new Discord.RichEmbed()
							.setAuthor(msg.author.tag)
							.setTitle(`__**Item ${title.replace('\n', '')} - #${id} added!**__`)
							.setFooter('Provided by fipsi#0789 and DroppingThePacketsHard²#4751')
							.setColor(embedColor)
							.setDescription('Ping the seller for more information!')
							.addField('Title', title.replace('\n', ''))
							.addField('ID', id)
							.addField('Description', description)
							.addField('Price', `${getTrtlPrice(formattedPrice)} TRTL`), true, (mId) => {
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
	if (formatd.indexOf('USD') > -1) {
		price = parseFloat(formatd.replace('USD', '').trim()) / prizes['usd'];
	} else if (formatd.indexOf('EUR') > -1) {
		price = parseFloat(formatd.replace('EUR', '').trim()) / prizes['eur'];
	} else if (formatd.indexOf('TRTL') > -1) {
		price = parseFloat(formatd.replace('TRTL', '').trim());
	}
	return (isNaN(price) ? 0 : formatMoney(price, 2, '.', ','));
}

function updatePrizes() {
	get('https://api.coingecko.com/api/v3/simple/price?ids=turtlecoin&vs_currencies=usd,eur', function (data) {
		console.log('Price:', data);
		if (data !== false) {
			data = JSON.parse(data);
			prizes = data['turtlecoin'];
			fs.readFile('items.json', 'utf8', (err, data) => {
				if (err) {  }
				data = JSON.parse(data);
				for (itemId in data) {
					let item = data[itemId];
					client.channels.get(operatingChannel).fetchMessage(item.msgId).then((message) => {
						let content = message.content;

						message.edit(
							content.replace(/([0-9., ]{2,}TRTL)/gi, ' ' + getTrtlPrice(item.price) + ' TRTL')
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

function replyWithEmbed(embed, pinMessage, msgIdCb) {
	currentChannel.send('', embed)
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

function formatMoney(amount, decimalCount = 2, decimal = '.', thousands = ',') {
  try {
    decimalCount = Math.abs(decimalCount);
    decimalCount = isNaN(decimalCount) ? 2 : decimalCount;

    const negativeSign = amount < 0 ? '-' : '';

    let i = parseInt(amount = Math.abs(Number(amount) || 0).toFixed(decimalCount)).toString();
    let j = (i.length > 3) ? i.length % 3 : 0;

    return negativeSign + (j ? i.substr(0, j) + thousands : '') + i.substr(j).replace(/(\d{3})(?=\d)/g, '$1' + thousands) + (decimalCount ? decimal + Math.abs(amount - i).toFixed(decimalCount).slice(2) : '');
  } catch (e) {
    console.log(e)
  }
};
