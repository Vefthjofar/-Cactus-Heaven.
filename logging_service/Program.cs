using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using System;
using System.Text;
using System.IO;

namespace logging_service
{
    class Program
    {
        public static void Main(string[] args)
        {
            var Factory = new ConnectionFactory() { HostName = "localhost" };
            using (var Connection = Factory.CreateConnection())
            using (var Channel = Connection.CreateModel())
            {
                var OrderExchange = "order_exchange";
                var LoggingQueue = "logging_queue";
                var CreateOrder = "create_order";

                Channel.ExchangeDeclare(OrderExchange, "direct", true);
                Channel.QueueDeclare(queue: LoggingQueue, true);
                Channel.QueueBind(queue: LoggingQueue, exchange: OrderExchange, routingKey: CreateOrder);

                var Consumer = new EventingBasicConsumer(Channel);

                Consumer.Received += (model, ea) =>
                {
                    var message = Encoding.UTF8.GetString(ea.Body);
                    using (StreamWriter sw = File.AppendText("log.txt")) {
                        sw.WriteLine("Log: " + message);
                    }
                    Console.WriteLine(" [x] Received {0}", message);
                };
                Channel.BasicConsume(queue: LoggingQueue,
                                 autoAck: true,
                                 consumer: Consumer);

                Channel.Close();
                Connection.Close();
            }
        }
    }
}
