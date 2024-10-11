const cloud = require('wx-server-sdk');
const axios = require('axios');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  console.log('云函数开始执行，时间戳:', Date.now());
  console.log('接收到的事件数据:', event);
  
  const { url } = event;
  console.log('处理的URL:', url);

  try {
    console.log('开始调用书单处理接口，时间戳:', Date.now());
    
    const axiosInstance = axios.create({
      timeout: 50000 // 设置 50 秒超时
    });

    const response = await axiosInstance.post('https://bisheng.dataelem.com/api/v1/process/49c7d0f5-b83e-4fb0-bbe5-0ad3a64d8137', {
      inputs: { input: "书评人", id: "LLMChain-cd815" },
      tweaks: {
        "WebBaseLoader-af6db": { web_path: url },
        "BishengLLM-db49d": {},
        "LLMChain-cd815": {},
        "PromptTemplate-fcf54": {}
      }
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('接口调用成功，时间戳:', Date.now());
    console.log('返回数据:', JSON.stringify(response.data));

    const result = response.data.data.result;

    try {
      console.log('开始解析返回的JSON数据');
      const bookListData = JSON.parse(result.answer.replace(/```json\n|\n```/g, ''));
      console.log('解析后的书单数据:', JSON.stringify(bookListData, null, 2));

      // 提取所需的字段，包括新增的"书单内容"
      const {
        "书单名称": title,
        "书单作者": author,
        "书单描述": description,
        "标签": tags,
        "评价": review,
        "书单内容": bookListContent // 新增字段
      } = bookListData;

      console.log('提取的书单内容:', bookListContent);

      console.log('开始存储数据到数据库');
      // 存储到数据库，包括新增的"书单内容"字段
      const dataToAdd = {
        title,
        author,
        description,
        tags,
        review,
        bookListContent, // 新增字段
        url,
        createdAt: db.serverDate()
      };
      console.log('准备添加到数据库的数据:', JSON.stringify(dataToAdd, null, 2));

      const addResult = await db.collection('bookLists').add({
        data: dataToAdd
      });

      console.log('数据库添加结果:', addResult);

      return { 
        success: true, 
        message: '书单添加成功', 
        data: { title, author, description, tags, review, bookListContent } // 包含新字段在返回数据中
      };
    } catch (parseError) {
      console.error('JSON解析失败:', parseError);
      return { success: false, message: result.answer };
    }
  } catch (error) {
    console.error('处理异常:', error);
    if (error.response) {
      console.error('错误响应数据:', error.response.data);
      console.error('错误响应状态:', error.response.status);
      console.error('错误响应头:', error.response.headers);
    } else if (error.request) {
      console.error('未收到响应:', error.request);
    } else {
      console.error('错误信息:', error.message);
    }
    return { success: false, message: '处理异常,请稍后重试或换其他网址重试' };
  } finally {
    console.log('云函数执行结束，时间戳:', Date.now());
  }
};