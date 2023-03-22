<template>
  <div class="flex-column">
    <div class="flex-row gap20">
      <div class=" label">选择ip</div>
      <el-select v-model="serverIp">
        <el-option v-for="item in ipOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      <el-input-number v-model="serverPort" :min="0" :max="65535" />
      <el-button @click="startBtnStatus.onClick" :color="startBtnStatus.color">{{ startBtnStatus.text }}</el-button>
    </div>
    <div class="flex-row auto-height" style="margin-top: 20px;">
      <div class="left-panel">
        <div v-for="(client, index) in clients" :key="index">
          <div>{{ client.ip }}:{{ client.port }}</div>
          <!-- 连接时间 -->
          <div>{{ client.connectTime }}</div>
        </div>
        <div v-if="!clients.length" class="placeholder" style="text-align: center; margin-top: 50px;">暂无客户端连接</div>
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
import { reactive, ref, computed } from "vue";
import net from "net";
import { ElMessage, ElMessageBox } from "element-plus";
import { listAllLocalIp } from "@/util/commonUtil";

const serverIp = ref('0.0.0.0');
const serverPort = ref(8020);
let server = null;
let serverStarted = ref(false);
// 客户端列表
const clients = reactive([]);
const sendData = ref('');
const sendType = ref('1');
const currClient = reactive({});
// 获取本机所有ip
const ipOptions = ['0.0.0.0'].concat(listAllLocalIp()).map(ip => {
  return {
    label: ip,
    value: ip
  }
});

const startBtnStatus = computed(() => {
  if (serverStarted.value) {
    return {
      onClick: stopServer,
      text: '断开',
      color: 'red'
    }
  }
  return {
    onClick: startServer,
    text: '启动',
    color: 'green'
  }
})

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
  server.on("close", (e) => {
    // server.close();
    serverStarted.value = false;
    ElMessage({
      message: "服务已关闭",
      type: "info",
    });
    addMessage(`服务已关闭`);
  });
  server.listen({
    host: serverIp.value,
    port: serverPort.value
  }, () => {
    serverStarted.value = true;
    ElMessage({
      message: "启动成功",
      type: "success",
    });
    addMessage(`TCP Server启动成功, 端口:${serverPort.value}`);
  });
};

const stopServer = () => {
  server.close();
  // serverStarted.value = false;
}

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

<style lang="less">
.left-panel {
  border: 1px solid #ccc;
  height: 100%;
  width:200px
}
</style>
