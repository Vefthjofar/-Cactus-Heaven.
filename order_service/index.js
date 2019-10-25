const db = require("./data/db");
const fs = require("fs");
const amqp = require("amqplib/callback_api");

const messageBrokerInfo = {
  exchanges: {
    order: "order_exchange"
  },
  queues: {
    orderQueue: "order_queue"
  },
  routingKeys: {
    input: "create_order"
  }
};

const createMessageBrokerConnection = () =>
  new Promise((resolve, reject) => {
    amqp.connect("amqp://localhost", (err, conn) => {
      if (err) {
        reject(err);
      }
      resolve(conn);
    });
  });

const createChannel = connection =>
  new Promise((resolve, reject) => {
    connection.createChannel((err, channel) => {
      if (err) {
        reject(err);
      }
      configureMessageBroker(channel);
      resolve(channel);
    });
  });

const configureMessageBroker = channel => {
  const { exchanges, queues, routingKeys } = messageBrokerInfo;
  channel.assertExchange(exchanges.order, "direct", { durable: true });
  channel.assertQueue(queues.orderQueue, { durable: true });
  channel.bindQueue(queues.orderQueue, exchanges.order, routingKeys.input);
};

const parseAndCreate = async data => {
  let totalPrice = 0;

  data.items.forEach(item => {
    totalPrice += item.quantity * item.unitPrice;
  });

  const newOrder = {
    customerEmail: data.email,
    totalPrice,
    orderDate: Date.now()
  };

  const createdOrder = await db.Order.create(newOrder);

  data.items.forEach(item => {
    const newOrderItem = {
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      rowPrice: item.quantity * item.unitPrice,
      orderId: createdOrder._id
    };
    db.OrderItem.create(newOrderItem);
  });
};

(async () => {
  const messageBrokerConnection = await createMessageBrokerConnection();
  const channel = await createChannel(messageBrokerConnection);

  const { order } = messageBrokerInfo.exchanges;
  const { order_queue } = messageBrokerInfo.queues;

  channel.consume(
    order_queue,
    async data => {
      console.log(data.content.toString());
      const dataJson = JSON.parse(data.content.toString());
      await parseAndCreate(dataJson);
    },
    { noAck: true }
  );
})().catch(e => console.error(e));
