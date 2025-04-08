const fs = require('fs');
const { chromium } = require('playwright');
const express = require('express');
const uuid = require('uuid');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

let browserInstances = {};

// Endpoint to handle API 1 (login/password submission)
app.post('/login-with-mpin', async (req, res) => {
  const { mobile, mpin } = req.body;
  const userId = uuid.v4(); // Generate a unique user ID
  // Launch a browser if not already launched for the user
  if (!browserInstances[userId]) {
    const browser = await chromium.launch({ headless: false }); // Non-headless if you want to see it
    const context = await browser.newContext();
    browserInstances[userId] = { browser, context };
  }
  try {
    // Access the browser context for the user
    const { context } = browserInstances[userId];
    const page = await context.newPage();
    await page.goto('https://web.umang.gov.in/web_new/login'); // Replace with the actual login URL

    // Fill out the login form
    await page.fill("input[formcontrolname='mob']", mobile);
    await page.fill("input[formcontrolname='mpin']", mpin);
    // const loginButton = await page.locator('button.class-name:text("Login")');
    // Select all buttons on the page
    const buttons = await page.locator('button');
    // Loop through and filter buttons by text
    const buttonsCount = await buttons.count();
    console.log('**********');
    console.log('buttonsCount', buttonsCount);
    console.log('**********');
    for (let i = 0; i < buttonsCount; i++) {
      const button = buttons.nth(i);
      const text = await button.textContent();
      console.log('**********');
      console.log('text', text);
      console.log('**********');
      if (text.trim() === 'Login') {
        // Perform your action on the login button
        console.log('Found the login button!');
        // You can click the button or perform other actions here
        await button.click();
        break; // Exit the loop after finding the button
      }
    }
    await page.waitForNavigation({ waitUntil: 'load' }); // Wait for final submission or page load
    // Wait for OTP to be sent (can be based on a selector or time delay)
    //   await page.waitForSelector("#otpField"); // Assume OTP input field is present after login
    return res.json({
      success: true,
      userId,
      message: 'Login unsuccessful',
      data: {
        session: {
          mobile,
          page,
        },
      },
    });
  } catch (error) {
    console.log(error);
  }
});

app.post('/search-raise-claim', async (req, res) => {
  const { userId } = req.body;
  // Ensure the user has an active session (browser instance)
  if (!browserInstances[userId]) {
    return res.status(400).send('User session not found');
  }
  const { context } = browserInstances[userId];
  const page = await context.pages()[0];

  await page.fill('div.search-input-wrap input', 'raise claim');
  await page.keyboard.press('Enter');

  await page.waitForTimeout(1000);

  res.json({
    success: true,
    userId,
    message: 'Raise Claim searched successfully',
    data: {
      session: {
        page,
      },
    },
  });
});

app.post('/click-raise-claim-without-iframe', async (req, res) => {
  const { userId } = req.body;
  // Ensure the user has an active session (browser instance)
  if (!browserInstances[userId]) {
    return res.status(400).send('User session not found');
  }
  const { context } = browserInstances[userId];
  const page = await context.pages()[0];

  // Find the Raise Claim text inside the iframe and click it
  const raiseClaimTextLocators = await page.locator('text=Raise Claim');
  const raiseClaimTextLocatorsCount = await raiseClaimTextLocators.count();

  console.log('**********');
  console.log('raiseClaimTextLocatorsCount', raiseClaimTextLocatorsCount);
  console.log('**********');
  for (let i = 0; i < raiseClaimTextLocatorsCount; i++) {
    const button = raiseClaimTextLocators.nth(i);
    const text = await button.textContent();
    if (text.trim() === 'Raise Claim') {
      console.log('Found the raise claim button!');
      await button.click();
      break;
    }
  }
  res.json({
    success: true,
    message: 'Clicked Raise Claim without iframe successfully',
    data: {
      session: {
        userId,
        page,
      },
    },
  });
});

// Endpoint to handle API 2 (click-epfo)
app.post('/click-epfo', async (req, res) => {
  const { userId } = req.body;
  // Ensure the user has an active session (browser instance)
  if (!browserInstances[userId]) {
    return res.status(400).send('User session not found');
  }
  const { context } = browserInstances[userId];
  const page = await context.pages()[0];
  // Find the EPFO text on the page and click it
  const epfoTextLocator = await page.locator(
    'text=Social Security & Pensioners'
  );
  // Check if the text is present on the page
  const isEpfoTextPresent = await epfoTextLocator.isVisible();
  if (isEpfoTextPresent) {
    console.log('Text "Social Security & Pensioners" found on the page!');
    epfoTextLocator.click();
  } else {
    console.log('Text "Social Security & Pensioners" not found on the page.');
    return res.send(
      'Text "Social Security & Pensioners" not found on the page.'
    );
  }

  await page.waitForNavigation({ waitUntil: 'load' });

  res.json({
    success: true,
    message: 'Click EPFO successful',
    data: {
      session: {
        userId,
        page,
      },
    },
  });
});

// Endpoint to handle API 3 (click-epfo)
app.post('/click-raise-claim', async (req, res) => {
  const { userId } = req.body;
  // Ensure the user has an active session (browser instance)
  if (!browserInstances[userId]) {
    return res.status(400).send('User session not found');
  }
  const { context } = browserInstances[userId];
  const page = await context.pages()[0];
  // Locate the iframe element
  const iframeElement = await page.locator('iframe'); // You can specify a more precise selector if needed

  // Get the content frame of the iframe
  const iframe = await iframeElement.contentFrame();

  // Find the Raise Claim text inside the iframe and click it
  const raiseClaimTextLocators = await iframe.locator('text=Raise Claim');
  const raiseClaimTextLocatorsCount = await raiseClaimTextLocators.count();

  console.log('**********');
  console.log('raiseClaimTextLocatorsCount', raiseClaimTextLocatorsCount);
  console.log('**********');
  for (let i = 0; i < raiseClaimTextLocatorsCount; i++) {
    const button = raiseClaimTextLocators.nth(i);
    const text = await button.textContent();
    if (text.trim() === 'Raise Claim') {
      console.log('Found the raise claim button!');
      await button.click();
      break;
    }
  }
  res.json({
    success: true,
    message: 'Click Raise Claim successful',
    data: {
      session: {
        userId,
        page,
      },
    },
  });
});

app.post('/click-uan', async (req, res) => {
  const { userId } = req.body;
  console.log('**********');
  console.log('userId', userId);
  console.log('**********');
  // Ensure the user has an active session (browser instance)
  if (!browserInstances[userId]) {
    return res.status(400).send('User session not found');
  }
  const { context } = browserInstances[userId];
  const page = await context.pages()[0];
  // Locate the iframe element
  let iframeElement = await page.locator('iframe'); // You can specify a more precise selector if needed
  // Get the content frame of the iframe
  let iframe = await iframeElement.contentFrame();

  let buttons = await iframe.locator('button');

  // Loop through and filter buttons by text
  let buttonsCount = await buttons.count();
  console.log('**********');
  console.log('buttonsCount', buttonsCount);
  console.log('**********');
  for (let i = 0; i < buttonsCount; i++) {
    const button = buttons.nth(i);
    const text = await button.textContent();
    console.log('**********');
    console.log('text', text);
    console.log('**********');
    if (text.trim() === 'Submit') {
      // Perform your action on the login button
      console.log('Found the Submit button!');
      // You can click the button or perform other actions here
      await button.click();
      break; // Exit the loop after finding the button
    }
  }

  res.json({
    success: true,
    message: 'Submit UAN successful',
    data: {
      session: {
        userId,
        page,
      },
    },
  });
});

app.post('/click-close-button', async (req, res) => {
  const { userId } = req.body;
  console.log('**********');
  console.log('userId click close button', userId);
  console.log('**********');
  // Ensure the user has an active session (browser instance)
  if (!browserInstances[userId]) {
    return res.status(400).send('User session not found');
  }
  const { context } = browserInstances[userId];
  const page = await context.pages()[0];
  // Locate the iframe element
  let iframeElement = await page.locator('iframe'); // You can specify a more precise selector if needed
  // Get the content frame of the iframe
  let iframe = await iframeElement.contentFrame();
  let buttons = await iframe.locator('button');
  // Loop through and filter buttons by text
  let buttonsCount = await buttons.count();
  console.log('**********');
  console.log('buttonsCount', buttonsCount);
  console.log('**********');
  for (let i = 0; i < buttonsCount; i++) {
    const button = buttons.nth(i);
    const text = await button.textContent();
    console.log('**********');
    console.log('text', text);
    console.log('**********');
    if (text.trim() === 'Close') {
      // Perform your action on the login button
      console.log('Found the Close button!');
      // You can click the button or perform other actions here
      await button.click();
      break; // Exit the loop after finding the button
    }
  }
  res.json({
    success: true,
    message: 'Submit UAN successful',
    data: {
      session: {
        userId,
        page,
      },
    },
  });
});

app.post('/submit-account-number', async (req, res) => {
  const { userId, accountNumber } = req.body;

  // Ensure the user has an active session (browser instance)
  if (!browserInstances[userId]) {
    return res.status(400).send('User session not found');
  }
  const { context } = browserInstances[userId];
  const page = await context.pages()[0];

  // Locate the iframe element
  let iframeElement = await page.locator('iframe'); // You can specify a more precise selector if needed
  // Get the content frame of the iframe
  let iframe = await iframeElement.contentFrame();

  const inputLocator = await iframe.locator(
    "input[formcontrolname='bankAccountsFourDigits']"
  );
  await inputLocator.fill(accountNumber);

  let buttons = await iframe.locator('button');
  // Loop through and filter buttons by text
  let buttonsCount = await buttons.count();

  console.log('**********');
  console.log('buttonsCount', buttonsCount);
  console.log('**********');

  for (let i = 0; i < buttonsCount; i++) {
    const button = buttons.nth(i);
    const text = await button.textContent();
    console.log('**********');
    console.log('text', text);
    console.log('**********');

    if (text.trim() === 'Next') {
      // Perform your action on the login button
      await button.isVisible();
      console.log('Found the Next button!');
      // You can click the button or perform other actions here
      await button.click();
      break; // Exit the loop after finding the button
    }
  }
  res.json({
    success: true,
    message: 'Submit Account Number successful',
    data: {
      session: {
        userId,
        page,
      },
    },
  });
});

app.post('/submit-service-details', async (req, res) => {
  const { userId } = req.body;
  console.log('**********');
  console.log('userId', userId);
  console.log('**********');
  // Ensure the user has an active session (browser instance)
  if (!browserInstances[userId]) {
    return res.status(400).send('User session not found');
  }
  const { context } = browserInstances[userId];
  const page = await context.pages()[0];
  // Locate the iframe element
  let iframeElement = await page.locator('iframe'); // You can specify a more precise selector if needed
  // Get the content frame of the iframe
  let iframe = await iframeElement.contentFrame();

  let buttons = await iframe.locator('button');

  // Loop through and filter buttons by text
  let buttonsCount = await buttons.count();
  console.log('**********');
  console.log('buttonsCount', buttonsCount);
  console.log('**********');
  for (let i = 0; i < buttonsCount; i++) {
    const button = buttons.nth(i);
    const text = await button.textContent();
    console.log('**********');
    console.log('text', text);
    console.log('**********');
    if (text.trim() === 'Next') {
      // Perform your action on the login button
      console.log('Found the Next button!');
      // You can click the button or perform other actions here
      await button.click();
      break; // Exit the loop after finding the button
    }
  }

  res.json({
    success: true,
    message: 'Submit Service Details successful',
    data: {
      session: {
        userId,
        page,
      },
    },
  });
});

app.post('/submit-address-details', async (req, res) => {
  const { userId, locality, state, district, city, pinCode } = req.body;
  console.log('**********');
  console.log('userId', userId);
  console.log('locality', locality);
  console.log('state', state);
  console.log('district', userId);
  console.log('city', city);
  console.log('pinCode', pinCode);
  console.log('**********');
  // Ensure the user has an active session (browser instance)
  if (!browserInstances[userId]) {
    return res.status(400).send('User session not found');
  }
  const { context } = browserInstances[userId];
  const page = await context.pages()[0];
  // Locate the iframe element
  let iframeElement = await page.locator('iframe'); // You can specify a more precise selector if needed
  // Get the content frame of the iframe
  let iframe = await iframeElement.contentFrame();

  // Locality
  const localityLocator = await iframe.locator(
    "input[formcontrolname='locality']"
  );
  await localityLocator.fill(locality);

  // City
  const cityLocator = await iframe.locator("input[formcontrolname='city']");
  await cityLocator.fill(city);

  // Pin code
  const pinCodeLocator = await iframe.locator(
    "input[formcontrolname='pinCode']"
  );
  await pinCodeLocator.fill(pinCode);

  let spans = await iframe.locator('span.mat-select-min-line');

  // Loop through and filter buttons by text
  let spansCount = await spans.count();
  console.log('**********');
  console.log('spansCount', spansCount);
  console.log('**********');
  for (let i = 0; i < spansCount; i++) {
    const span = spans.nth(i);
    if (i === 0) {
      span.innerHtml = state;
    } else if (i === 0) {
      span.innerHtml = district;
    }
  }
  let buttons = await iframe.locator('button');

  // Loop through and filter buttons by text
  let buttonsCount = await buttons.count();
  console.log('**********');
  console.log('buttonsCount', buttonsCount);
  console.log('**********');
  for (let i = 0; i < buttonsCount; i++) {
    const button = buttons.nth(i);
    const text = await button.textContent();
    console.log('**********');
    console.log('text', text);
    console.log('**********');
    if (text.trim() === 'Next') {
      // Perform your action on the login button
      console.log('Found the Next button!');
      // You can click the button or perform other actions here
      await button.click();
      break; // Exit the loop after finding the button
    }
  }

  res.json({
    success: true,
    message: 'Submit Service Details successful',
    data: {
      session: {
        userId,
        page,
      },
    },
  });
});

// Server setup
app.listen(3000, () => {
  console.log('Server running on port 3000');
});
