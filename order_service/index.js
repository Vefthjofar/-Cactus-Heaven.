const db = require('./data/db')
const fs = require('fs');
const amqp = require('amqplib/callback_api');

const messageBrokerInfo = {
    exchanges: {
        order: 'order_exchange'
    },
    queues: {
        orderQueue:'order_queue'
    },
    routingKeys: {
        input: 'create_order'
    }
}

const createMessageBrokerConnection = () => new Promise((resolve, reject) => {
    amqp.connect('amqp://localhost', (err, conn) => {
        if (err) { reject(err); }
        resolve(conn);
    });
});

const createChannel = connection => new Promise((resolve, reject) => {
    connection.createChannel((err, channel) => {
        if (err) { reject(err); }
        configureMessageBroker(channel);
        resolve(channel);
    });
});

const configureMessageBroker = channel => {
        const { exchanges, queues, routingKeys } = messageBrokerInfo;
        channel.assertExchange(exchanges.order, 'direct', { durable: true });
        channel.assertQueue(queues.orderQueue, { durable: true });
        channel.bindQueue(queues.orderQueue, exchanges.order, routingKeys.input);
};

const parseAndCreate = data => {
    
}

(async () => {
    const messageBrokerConnection = await createMessageBrokerConnection();
    const channel = await createChannel(messageBrokerConnection);

    const { order } = messageBrokerInfo.exchanges;
    const { order_queue } = messageBrokerInfo.queues;

    channel.consume(order_queue, data => {
        console.log(data.content.toString());
        const dataJson = JSON.parse(data.content.toString());
    }, { noAck: true });
})().catch(e => console.error(e));