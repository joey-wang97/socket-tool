<template>
  <div>
    <el-input-number v-model="serverPort" :min="0" :max="65535" />
    <el-input v-model="data" />
    <el-button @click="startServer" color="green">Start</el-button>
    <div class="flex-row">
      <div>
        <div v-for="(client, index) in clients" :key="index">
          <div>{{ client.ip }}:{{ client.port }}</div>
          <!-- 连接时间 -->
          <div>{{ client.connectTime }}</div>
        </div>
        <div v-if="!clients.length">暂无客户端连接</div>
      </div>
      <!-- 消息区域 -->
      <div>
        <!-- 发送区 -->
        <div>发送区</div>
        <el-input v-model="sendData" :rows="5" type="textarea" placeholder="Please input data to send" />
        <div>
          <el-radio-group v-model="sendType" class="ml-4">
            <el-radio label="1" size="large">Option 1</el-radio>
            <el-radio label="2" size="large">Option 2</el-radio>
          </el-radio-group>
        </div>
        <div>接收区</div>
        <div>
          <div v-for="(msg, index) in currClient.messages" :key="index">
            {{ msg.type }} {{ msg.data }} {{ msg.time }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from "vue";
import net from "net";
import { ElMessage, ElMessageBox } from "element-plus";

const serverPort = ref(8020);
let server = null;
let serverStarted = false;
// 客户端列表
const clients = reactive([]);
const sendData = ref('');
const sendType = ref('1');
const currClient = reactive({});

const startServer = () => {
  // 有新连接时，进入回调
  server = net.createServer();
  server.on('connection', (connection) => {
    console.info('new client');
    ElMessage({
      message: "新的连接",
      type: "success",
    });
    // https://nodejs.org/api/net.html#socketaddress
    let address = connection.address();
    clients.push({
      ip: address.ip,
      family: address.family,
      address: address.address,
      messages: []
    });
    // 不设置编码默认为Buffer接收
    // https://nodejs.org/api/stream.html#readablesetencodingencoding
    // connection.setEncoding('')
    connection.on('close', () => {
      clients.messages.push({
        data: 'client closed',
        time: new Date(),
        type: 'close'
      })
    })
    connection.on('error', (e) => {
      clients.messages.push({
        data: 'client error:' + e,
        time: new Date(),
        type: 'error'
      })
    })
    connection.on('data', (data) => {
      clients.messages.push({
        data: data,
        time: new Date(),
        type: 'data'
      })
    })
  });
  server.on("error", (e) => {
    console.error(e);
    if (e.code === 'EADDRINUSE') {
      ElMessage({
        message: "端口被占用",
        type: "error",
      });
      return;
    }

    ElMessageBox.alert(e, '错误', {
      confirmButtonText: 'OK'
    })
  });
  server.listen(serverPort.value, () => {
    serverStarted = true;
    ElMessage({
      message: "启动成功",
      type: "success",
    });
    addMessage(`TCP Server启动成功, 端口:${serverPort.value}`);
  });
};

// const send = () => {
//   if (client == null) {
//     ElMessage({
//       message: "请先启动服务",
//       type: "warning",
//     });
//     return;
//   }
//   if (!form.data) {
//     ElMessage({
//       message: "请输入要发送的内容",
//       type: "warning",
//     });
//     return;
//   }
//   client.write(form.data);
//   ElMessage({
//     message: "send data success",
//     type: "success",
//   });
// };

const addMessage = ({ content, type }) => {
  console.debug(content);
  // messages.value = messages.value + content;
};
</script>

<style></style>
