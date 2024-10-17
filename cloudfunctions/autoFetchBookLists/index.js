console.log('定时触发器已执行', new Date().toISOString());
const cloud = require('wx-server-sdk');
const axios = require('axios');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

// Bing Search API 配置
const BING_SEARCH_API_ENDPOINT = 'https://api.bing.microsoft.com/v7.0/search';
const BING_SEARCH_API_KEY = process.env.BING_SEARCH_API_KEY; // 从环境变量中获取 API 密钥

// 获取最新的书单 URL
async function getLatestBookListUrls(date) {
  try {
    const formattedDate = date.toISOString().split('T')[0];
    const query = `site:douban.com/doulist ${formattedDate}`;

    const response = await axios.get(BING_SEARCH_API_ENDPOINT, {
      params: {
        q: query,
        count: 100,  // 增加数量以获取更多结果
        mkt: 'zh-CN'
      },
      headers: {
        'Ocp-Apim-Subscription-Key': BING_SEARCH_API_KEY
      }
    });

    if (response.data && response.data.webPages && Array.isArray(response.data.webPages.value)) {
      return response.data.webPages.value.map(page => page.url);
    } else {
      console.warn(`未找到搜索结果或结果格不正确: ${query}`);
      return [];
    }
  } catch (error) {
    console.error('获取书单 URL 失败:', error);
    return [];
  }
}

// 这个函数用于处理单个书单
async function processBookList(url) {
  try {
    console.log(`开始处理 URL: ${url}`);
    
    // 获取豆列页面内容
    const response = await axios.get(url);
    const htmlContent = response.data;
    
    // 检查是否为书单
    const isBookList = checkIfBookList(htmlContent);
    
    if (!isBookList) {
      console.log(`URL ${url} 不是书单，跳过处理`);
      return;
    }

    // 如果是书单，继续处理
    const bishengResponse = await axios.post('https://bisheng.dataelem.com/api/v1/process/49c7d0f5-b83e-4fb0-bbe5-0ad3a64d8137', {
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

    console.log('bisheng API 原始响应:', JSON.stringify(bishengResponse.data));

    const result = bishengResponse.data.data.result;
    console.log('解析前的 result:', result);

    // 检查是否存在书单信息
    if (result.answer.includes('抱歉') && result.answer.includes('没有书单')) {
      console.log(`URL ${url} 中没有找到书单信息，跳过处理`);
      return;
    }

    let bookListData;
    try {
      // 移除多余的反引号和"json"标记
      const cleanedResult = result.answer.replace(/```json\n|\n```/g, '');
      bookListData = JSON.parse(cleanedResult);
    } catch (parseError) {
      console.error('JSON 解析失败，尝试直接使用响应:', result.answer);
      // 使用正则表达式提取信息
      const extractInfo = (key) => {
        const match = result.answer.match(new RegExp(`"${key}":\\s*"([^"]*)"`, 'i'));
        return match ? match[1] : '未知';
      };
      bookListData = {
        "书单名称": extractInfo("书单名称"),
        "书单作者": extractInfo("书单作者"),
        "书单描述": extractInfo("书单描述"),
        "标签": extractInfo("标签").split(',').map(tag => tag.trim()),
        "评价": extractInfo("评价"),
        "书单内容": extractInfo("书单内容").split('\n'),
        "评级": extractInfo("评级")
      };
    }

    // 检查是否成功提取到书单名称
    if (bookListData["书单名称"] === '未知') {
      console.log(`无法从 URL ${url} 提取有效的书单信息，跳过处理`);
      return;
    }

    const {
      "书单名称": title,
      "书单作者": author,
      "书单描述": description,
      "标签": tags,
      "评价": review,
      "书单内容": bookListContent,
      "评级": grade
    } = bookListData;

    // 检查书单是否已存在
    const existingBookList = await db.collection('bookLists').where({
      url: url
    }).get();

    if (existingBookList.data.length === 0) {
      // 如果书单不存在，添加到数据库
      await db.collection('bookLists').add({
        data: {
          title,
          author,
          description,
          tags,
          review,
          bookListContent,
          grade,
          url,
          createdAt: db.serverDate(),
          userId: 'system' // 使用 'system' 表示这是自动添加的
        }
      });
      console.log(`成功添加新书单: ${title}`);
    } else {
      console.log(`书单已存在，跳过: ${title}`);
    }
  } catch (error) {
    console.error(`处理书单失败: ${url}`, error);
  }
}

function checkIfBookList(htmlContent) {
  // 直接使用 HTML 内容字符串
  const lowerHtmlContent = htmlContent.toLowerCase();

  // 检查是否包含与书籍相关的关键词
  const bookKeywords = ['出版社'];
  
  return bookKeywords.some(keyword => lowerHtmlContent.includes(keyword));
}

// 获取或更新上次处理的日期
async function getLastProcessedDate() {
  const configCollection = db.collection('functionConfig');
  try {
    const config = await configCollection.doc('autoFetchBookLists').get();
    
    if (config.data) {
      return new Date(config.data.lastProcessedDate);
    }
  } catch (error) {
    console.log('获取配置文档失败，可能是首次运行:', error);
  }

  // 如果文档不存在或获取失败，创建新文档
  const startDate = new Date('2015-01-01');
  try {
    await configCollection.add({
      data: {
        _id: 'autoFetchBookLists',
        lastProcessedDate: startDate
      }
    });
    console.log('创建了新的配置文档，起始日期为:', startDate.toISOString());
  } catch (addError) {
    console.error('创建配置文档失败:', addError);
    // 如果创建也失败，仍然返回起始日期
  }
  
  return startDate;
}

async function updateLastProcessedDate(currentDate) {
  const configCollection = db.collection('functionConfig');
  const nextDate = new Date(currentDate);
  nextDate.setDate(nextDate.getDate() + 1);  // 这会自动处理月末和年末的情况
  
  await configCollection.doc('autoFetchBookLists').update({
    data: {
      lastProcessedDate: nextDate
    }
  });
  
  return nextDate;
}

// 添加一个并发控制函数
async function concurrentProcess(items, processFunction, concurrency = 5) {
  const chunks = [];
  for (let i = 0; i < items.length; i += concurrency) {
    chunks.push(items.slice(i, i + concurrency));
  }

  const results = [];
  for (const chunk of chunks) {
    const chunkResults = await Promise.all(chunk.map(processFunction));
    results.push(...chunkResults);
  }

  return results;
}

exports.main = async (event, context) => {
  console.log('云函数被调用', new Date().toISOString());
  console.log('调用事件:', JSON.stringify(event));
  console.log('调用上下文:', JSON.stringify(context));

  const wxContext = cloud.getWXContext();
  console.log('WXContext:', JSON.stringify(wxContext));

  if (wxContext.SOURCE === 'wx_trigger') {
    console.log('函数由定时触发器触发');
  } else {
    console.log('函数由其他方式触发，SOURCE:', wxContext.SOURCE);
  }

  try {
    const currentDate = await getLastProcessedDate();
    console.log('正在处理的日期:', currentDate.toISOString());

    const urlsToFetch = await getLatestBookListUrls(currentDate);
    console.log('获取到的书单 URL:', urlsToFetch);

    // 使用并发处理
    await concurrentProcess(urlsToFetch, async (url, index) => {
      console.log(`开始处理 URL ${index + 1}/${urlsToFetch.length}: ${url}`);
      await processBookList(url);
    }, 5); // 设置并发数为 5

    // 更新处理日期到下一天
    const nextDate = await updateLastProcessedDate(currentDate);

    console.log('所有 URL 处理完成，下次将处理日期:', nextDate.toISOString());
    return { 
      message: '自动获取书单完成', 
      processedUrls: urlsToFetch.length, 
      processedDate: currentDate.toISOString(),
      nextDate: nextDate.toISOString(), 
      source: wxContext.SOURCE 
    };
  } catch (error) {
    console.error('云函数执行出错:', error);
    return { error: '云函数执行失败', details: error.message, source: wxContext.SOURCE };
  }
};
