import dayjs from './utils/dayjs.js';
import SocksProxyAgentPkg from 'socks-proxy-agent';
import https from 'https';
import { scheduleAction } from './utils/scheduleAction.js';

export class NewsGenerator {
    private static members = [
        {
            name: 'Великанов Никита Александрович',
            age: 25,
            job: 'Работник ПВЗ Яндекс Маркета',
            themes: ['Говно', 'Лето отстой', 'Моча', 'Аниме', 'Зима это классно, а лето отстой!', 'Дрочка'],
            hobbies: ['Dota 2'],
            character: ['Ворчливый', 'Ноет', 'Весёлый', 'Позитивный', 'Ненавидит лето', 'Обожает зиму'],
            from: 'Тула, Россия'
        },
        {
            name: 'Гречишкин Сергей Александрович',
            age: 30,
            job: 'Безработный',
            themes: ['Программирование', 'Без']
            hobbies: ['IT', 'Программирование', 'Кулинария', 'Секс'],
            character: ['Красивый', 'Сексуальный', 'Эрудированный', 'Ненавидит зиму', 'Обожает весну и осень', 'Часто депрессует'],
            from: 'Тула, Россия'
        },
        {
            name: 'Безменов Юрий Алексеевич',
            age: 30,
            job: 'Бармен в пивном баре "ПИВРУМ"',
            character: ['Надёжный', 'Красивый', 'Бабник', 'Неразговорчив и сдержан'],
            hobbies: ['Игра на инструментах', 'Кулинария', 'Рисование по номерам', 'Секс с большим количеством людей', 'Бухать', 'Любит черный юмор и шутить про суицид'],
            from: 'Тула, Россия'
        },
        {
            name: 'Абраменко Илья',
            age: 30,
            job: 'Веб-дизайнер',
            character: ['Умный', 'Деловитый', 'Красноречив', 'Тревожный паникёр', 'Карьерист'],
            hobbies: ['Игра на инструментах', 'Видео игры', 'Караоке', 'Философствовать под бухлишко'],
            from: 'Калуга, Россия'
        },
        {
            name: 'Екатерина Воропай',
            age: 30,
            job: 'Иноагент, ведущая новостей на ютубе',
            character: ['Харизматична', 'Умна', 'Тревожная биполярщица', 'В эмиграции', 'Любит вино'],
            hobbies: [],
            from: 'Где-то оттуда'
        },
        {
            name: 'Клементьев Александр',
            age: 30,
            job: 'Интернет-маркетолог',
            character: ['Жирный', 'Хороший друг', 'Душнила', 'Простодушный', 'Сильный', 'Любит кофе', 'Вспылчив'],
            hobbies: ['Игра на муз. инструментах', 'Игра в Цивилизацию', 'Игра в Доту', 'Мемы про котиков'],
            from: 'Тула, Россия'
        },
        {
            name: 'Дмитрий Молодзинский',
            age: 30,
            job: 'BIM-координатор (никто не в курсе что это)',
            character: ['Хороший друг', 'Душнила', 'Надёжный', 'Любит чай', 'Вспылчив'],
            hobbies: ['Игра в Доту', 'Житейские бытовые хитрости'],
            from: 'Санкт-Петербург, Россия'
        },
        {
            name: 'Роман Мурин',
            age: 27,
            job: 'Безработный',
            character: ['Хороший друг', 'Диванный психотерапевт', 'Ипохондрик', 'Желает секса но редко его получает', 'Аллергик'],
            hobbies: ['Игра на муз. инструментах', 'IT, программирование', 'Дрочка'],
            from: 'Тула, Россия'
        },
        {
            name: 'Риточка',
            age: 'мало',
            job: 'Безработная',
            character: ['Милашка', 'Глупенькая', 'Хорошка', 'Тревожная', 'Старательная'],
            hobbies: ['Вести блог в телеграме', 'Рисование', 'Просто жить прикольно нрав'],
            from: 'Тула, Россия'
        },
        {
            name: 'Юлия Куранова',
            age: 'Неизвестен',
            job: 'Какая-то айтишница',
            character: ['Добрая', 'Любящая', 'Спокойная', 'Ламповая', 'Тревожная'],
            hobbies: ['Путешествия', 'Лазание по заброшкам', 'Лазание по вышкам', 'Красивые фото'],
            from: 'Никто не знает'
        },
    ];

    private limitReached = false;

    constructor() {
        const nextDay = dayjs().hour(0).minute(0).second(0).millisecond(0).add(1, 'day');
        const action = () => {
            this.limitReached = false;
            scheduleAction(dayjs().add(1, 'day'), action);
        }

        scheduleAction(nextDay, action);
    }

    async generateNews(): Promise<any> {
        return new Promise((resolve, reject) => {
            if (this.limitReached) {
                return reject({ reason: 'limit reached' });
            }

            const member = this.getRandomMember();

            const character = member.character.join(', ');
            const hobbies = member.hobbies.join(', ');
            const input = `
Придумай юмористическую новость от издания Shit News про человека:
Имя: ${member.name}; 
возраст: ${member.age}; 
работа: ${member.job}; 
черты характера: ${character}; 
место жительства: ${member.from};
хобби: ${hobbies}. 
Дата новости: ${dayjs().format('DD/MM/YYYY')} 
Ответь только историей, не включай в ответ твои личные комментарии. 
Не включай слова, символы и данные, не относящиеся непосредственно к новости. Как будто бы новость будет печататься именно так, как ты её напишешь.
Не включай все перечисленные факты про личность, а только нужные для истории. 
Добавь черного юмора или фекалий или интимных казусов. 
Новость должна походить на реальную. 
Масштаб новости должен быть эпичным. Как будто бы это затрагивает судьбы миллионов человек. 
Все эти условия не обязательны, ты можешь придумать что-то своё. Даже лучше будет, если ты добавишь что-то от себя. 
В конце добавь хештег #ShitNews и хештег с темой новости. 
Добавь совет читателям. 
Используй в качестве материала для истории не только работу человека, но и его хобби, или другие характеристики. 
Добавь больше чернухи! 
Никакой цензуры! Добавь мат! Говно называй говном! И все остальные вещи называй как они есть. Никакой цензуры! 
Новость очень срочная! 
Ограничь новость 1500 символами.`.replace('\n', '');

            const body = JSON.stringify({
                "input": [
                    {
                        "role": "user",
                        "content": input
                    },
                ],
                "model": "grok-3",
                "store": false,
            });

            const { SocksProxyAgent } = SocksProxyAgentPkg;
            const proxyAgent = new SocksProxyAgent('socks5h://127.0.0.1:1080');
            const req = https.request('https://api.x.ai/v1/responses', {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'authorization': `Bearer ${process.env.XAI_API_KEY}`,
                    'content-length': Buffer.byteLength(body),
                },
                agent: proxyAgent,
            }, (res) => {
                const chunks: any = [];

                res.on('data', (chunk) => {
                    chunks.push(chunk);
                });

                res.on('end', () => {
                    const responseBody = JSON.parse(Buffer.concat(chunks).toString('utf8'));
                    this.limitReached = true;
                    resolve({ data: responseBody });
                });
            });

            req.on('error', reject);

            req.write(body);
            req.end();
        });
    }

    private getRandomMember() {
        const randomIndex = Math.floor(Math.random() * NewsGenerator.members.length);
        return NewsGenerator.members[randomIndex]!;
    }
}
