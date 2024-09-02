const tg = require('telegraf')

const { TgAdmin } = require("../models/tgadmins");

function createProductMarkup(product) {
    return `Продукт: ${product.productTitle}
Количество: ${product.quantity}
Цена: ${product.price}`
}

function orderTransform(order) {
    const calcPrice = order.products.map(v => v.price * v.quantity).reduce((acc, price) => acc + price)

    const productsMarkup = order.products
        .map(createProductMarkup)
        .join("\n\n")

    let text = `Новый заказ от пользователя: ${order.name}
Телефон: ${order.phoneNumber}
Сумма заказа: ${calcPrice}
Адрес: ${order.address}
Почтовый индекс: ${order.pincode}
Количество товаров: ${order.amount}
Время: ${order.date}

Товары:
${productsMarkup}
`
        return text
}

const commands = (()=> {
    let start = async function(ctx) {
        ctx.reply("Yo, how you are?");
    }

    return {
        start,
    }
})()

class TelegramService {
    //in
    constructor() {
        this._bot = new tg.Telegraf(process.env.BOT_TOKEN)
        this._running = false

        this._bot.use(async (ctx, next) => {
            let user = await TgAdmin.findOne({ telegramUserId: ctx.from.id });
            if (user) {
                ctx.telegramUserId = ctx.from.id
                return next()
            }
            await ctx.reply("You are not authorized to use this bot. Please contact the admin.")
        })

        Object.values(commands).forEach(cmd =>
            this._bot.command(cmd.name, (ctx) => cmd.call(this,ctx))
        )
    }

    async start() {
        if (this._running) {
            return;
        }
        try {
            let adminExisted = true;
            let admin = await TgAdmin.findOne({ telegramUserId: process.env.DEFAULT_BOT_ADMIN_ID });
            if (!admin) {
                adminExisted = false;
                const result = await TgAdmin.create({
                    telegramUserId: process.env.DEFAULT_BOT_ADMIN_ID
                });
            }
            await this._bot.launch();
            this._running = true;
            console.log("Telegram-bot service started");
        } catch(e) {
            throw e;
        }
    }

    async stop() {
        if (!this._running) return;
        this._running = false;
        this._bot.stop();
    }

    async sendNotify(order) {
        const admins = await TgAdmin.find({});
        for (const chatId of admins.map(user => user.telegramUserId)) {
            await this._bot.telegram.sendMessage(chatId, orderTransform(order));
        }
    }
}

var TgSingleton = (function(){
    var instance;
    return {
        getInstance: function(){
            if (instance == null) {
                instance = new TelegramService();
                // Hide the constructor so the returned object can't be new'd...
                instance.constructor = null;
            }
            return instance;
        }
   };
})();

module.exports = TgSingleton
