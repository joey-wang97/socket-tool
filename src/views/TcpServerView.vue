<template>
  <div class="flex-column">
    <div class="flex-row-vertical-center gap20">
      <div class=" label">选择ip</div>
      <el-select v-model="serverIp">
        <el-option v-for="item in ipOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      <el-input-number v-model="serverPort" :min="0" :max="65535" />
      <el-button @click="startBtnStatus.onClick" :color="startBtnStatus.color">{{ startBtnStatus.text }}</el-button>
    </div>
    <div class="flex-row auto-height" style="margin-top: 20px;">
      <div class="client-container">
        <div v-for="(client, index) in clients" :key="index" class="client-item" :class="{
          active: selectedClientIndex == index,
        }">
          <div @click="selectedClientIndex = index">
            <div>{{ client.address }}:{{ client.port }}</div>
            <!-- 连接时间 -->
            <div class="time">{{ client.connectTime }}</div>
          </div>
          <div>
            <el-button type="danger" :icon="Delete" @click="deleteClient(index)" />
          </div>
        </div>
        <div v-if="!clients.length" class="placeholder" style="text-align: center; margin-top: 50px;">暂无客户端连接</div>
      </div>
      <!-- 消息区域 -->
      <div class="data-area">
        <data-area ref="dataAreaRef" @send="send" v-model:receiveType="currClient.data.receiveType" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, watch } from "vue";
import { Delete } from '@element-plus/icons-vue'
import net from "net";
import { ElMessage, ElMessageBox } from "element-plus";
import { listAllLocalIp } from "@/util/commonUtil";
import DataArea from "@/components/DataArea.vue";

const serverIp = ref('0.0.0.0');
const STATUS = {
  CONNECTED: 0,
  DISCONNECTED: 1,
}
const serverPort = ref(8020);
let server = null;
let serverStarted = ref(false);
// 客户端列表
const clients = reactive([]);
const selectedClientIndex = ref(0);
const currClient = reactive({
  data: {
    receiveType: 'string'
  }
});
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

watch(selectedClientIndex,
  (val, old) => {
    currClient.data = clients[selectedClientIndex.value]
  }
);

const startServer = () => {
  // 有新连接时，进入回调
  server = net.createServer();
  server.on('connection', (connection) => {
    ElMessage({
      message: "新的连接",
      type: "success",
    });
    console.debug('new connection', connection);
    let c = {
      port: connection.remotePort,
      family: connection.remoteFamily,
      address: connection.remoteAddress,
      messages: [],
      status: STATUS.CONNECTED,
      connectTime: new Date().toLocaleString()
    };
    clients.push(c);
    // 如果只有一个连接，默认第一个为选中的
    if (clients.length == 1) {
      selectedClientIndex.value = 0;
    }
    // 不设置编码默认为Buffer接收
    // https://nodejs.org/api/stream.html#readablesetencodingencoding
    // connection.setEncoding('')
    connection.on('close', () => {
      c.messages.push({
        data: 'client closed',
        time: new Date(),
        type: 'close'
      })
      c.status = STATUS.CONNECTED;
    })
    connection.on('error', (e) => {
      console.error('client error', e);
      c.messages.push({
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

const deleteClient = (index) => {
  // let index = -1;
  // for (let i in clients) {
  //   let client = clients[i];
  //   if (client.connectTime == time) {
  //     index = i;
  //     break;
  //   }
  // }
  if (index < 0) {
    return;
  }
  clients.splice(index, 1);
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

<style lang="less" scoped>
.client-container {
  border: 1px solid #ccc;
  height: 100%;
  width: 200px;

  .client-item {
    width: 100%;
    padding: 20px 0;
    text-align: center;
    // color: #a8abb2;
    font-size: 16px;
    font-weight: 400;
    border-bottom: 1px solid #dcdfe6;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .active {
    color: #409eff;
    font-weight: bold;
  }

  .time {
    font-size: 12px;
    color: #a8abb2;
  }
}

.data-area {
  width: 100%;
  margin: 20px;
  // text-align: center;
}
</style>
