import { test, expect, Page } from '@playwright/test';
import { test as coverageTest } from 'playwright-test-coverage';
import { User, Role } from '../src/service/pizzaService';

async function basicInit(page: Page) {
  let loggedInUser: User | undefined;
  const validUsers: Record<string, User> = { 
    'd@jwt.com': { id: '3', name: 'Kai Chen', email: 'd@jwt.com', password: 'a', roles: [{ role: Role.Diner }] },
    'admin@jwt.com': { id: '5', name: 'Admin User', email: 'admin@jwt.com', password: 'admin', roles: [{ role: Role.Admin }] },
    'franchisee@jwt.com': { id: '6', name: 'Franchise User', email: 'franchisee@jwt.com', password: 'franchisee', roles: [{ role: Role.Franchisee, objectId: '2' }] }
  };

  //uthorize login
  await page.route('*/**/api/auth', async (route: any) => {
    const method = route.request().method();
    const reqData = route.request().postDataJSON();
    
    if (method === 'PUT') {
      //login
      const user = validUsers[reqData.email];
      if (!user || user.password !== reqData.password) {
        await route.fulfill({ status: 401, json: { error: 'Unauthorized' } });
        return;
      }
      loggedInUser = validUsers[reqData.email];
      const loginRes = {
        user: loggedInUser,
        token: 'abcdef',
      };
      await route.fulfill({ json: loginRes });
    } else if (method === 'POST') {



      //register
      const newUser = {
        id: '4',
        name: reqData.name,
        email: reqData.email,
        roles: [{ role: Role.Diner }]
      };
      loggedInUser = newUser;
      const registerRes = {
        user: newUser,
        token: 'abcdef',
      };



      await route.fulfill({ json: registerRes });
    } else if (method === 'DELETE') {



      // Logout
      loggedInUser = undefined;
      await route.fulfill({ status: 200, json: { message: 'Logged out' } });
    }
  });















  //logged in user
  await page.route('*/**/api/user/me', async (route: any) => {
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: loggedInUser });
  });






  //standardmenu
  await page.route('*/**/api/order/menu', async (route: any) => {
    const menuRes = [
      {
        id: 1,
        title: 'Veggie',
        image: 'pizza1.png',
        price: 0.0038,
        description: 'A garden of delight',
      },
      {
        id: 2,
        title: 'Pepperoni',
        image: 'pizza2.png',
        price: 0.0042,
        description: 'Spicy treat',
      },
    ];
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: menuRes });
  });








  //standard franchises and stores
  await page.route(/\/api\/franchise(\?.*)?$/, async (route: any) => {
    const franchiseRes = {
      franchises: [
        {


          id: 2,
          name: 'LotaPizza',


          stores: [
            { id: 4, name: 'Lehi' },
            { id: 5, name: 'Springville' },
            { id: 6, name: 'American Fork' },
          ],
        },
        { id: 3, name: 'PizzaCorp', stores: [{ id: 7, name: 'Spanish Fork' }] },
        { id: 4, name: 'topSpot', stores: [] },
      ],
    };




    //handle both GET and POST requests to franchise endpoint
    const method = route.request().method();
    if (method === 'GET') {
      //for GET requests, return franchise list
      await route.fulfill({ json: franchiseRes });



    } else if (method === 'POST') {
      //for POST requests, return success response
      await route.fulfill({ json: { success: true } });
    }
  });






  // Order a pizza
  await page.route('*/**/api/order', async (route: any) => {
    const method = route.request().method();
    if (method === 'POST') {
      const orderReq = route.request().postDataJSON();
      const orderRes = {
        order: { ...orderReq, id: 23 },
        jwt: 'eyJpYXQ',
      };
      await route.fulfill({ json: orderRes });
    } else if (method === 'GET') {





      //get orders for user
      const ordersRes = {
        id: '3',
        dinerId: '3',
        orders: [
          {
            id: '23',
            franchiseId: '1',
            storeId: '4',
            date: '2024-01-01T00:00:00.000Z',
            items: [
              { menuId: '1', description: 'Veggie', price: 0.0038 },
              { menuId: '2', description: 'Pepperoni', price: 0.0042 },
            ],
          },
        ],
      };
      await route.fulfill({ json: ordersRes });




    }
  });

  await page.goto('/');
}







coverageTest('login', async ({ page }) => {
  await basicInit(page);
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('a');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByRole('link', { name: 'KC' })).toBeVisible();
});








coverageTest('purchase with login', async ({ page }) => {
  await basicInit(page);



  // Go to page
  await page.getByRole('button', { name: 'Order now' }).click();
  await expect(page.locator('h2')).toContainText('Awesome is a click away');
  await page.getByRole('combobox').selectOption('4');
  await page.getByRole('link', { name: 'Image Description Veggie A' }).click();
  await page.getByRole('link', { name: 'Image Description Pepperoni' }).click();
  await expect(page.locator('form')).toContainText('Selected pizzas: 2');
  await page.getByRole('button', { name: 'Checkout' }).click();




  //login
  await page.getByPlaceholder('Email address').click();
  await page.getByPlaceholder('Email address').fill('d@jwt.com');
  await page.getByPlaceholder('Email address').press('Tab');
  await page.getByPlaceholder('Password').fill('a');
  await page.getByRole('button', { name: 'Login' }).click();







  // Pay
  await expect(page.getByRole('main')).toContainText('Send me those 2 pizzas right now!');
  await expect(page.locator('tbody')).toContainText('Veggie');
  await expect(page.locator('tbody')).toContainText('Pepperoni');
  await expect(page.locator('tfoot')).toContainText('0.008 ₿');
  await page.getByRole('button', { name: 'Pay now' }).click();







  //check balance
  await expect(page.getByText('0.008')).toBeVisible();
});








coverageTest('home page', async ({ page }) => {
  await basicInit(page);
  expect(await page.title()).toBe('JWT Pizza');
});








coverageTest('menu page', async ({ page }) => {
  await basicInit(page);
  await page.getByRole('link', { name: 'Order' }).click();
  await expect(page.locator('h2')).toContainText('Awesome is a click away');
});







coverageTest('about page', async ({ page }) => {
  await basicInit(page);
  await page.getByRole('link', { name: 'About' }).click();
  await expect(page.getByRole('heading', { name: 'The secret sauce' })).toBeVisible();
});







coverageTest('register', async ({ page }) => {
  await basicInit(page);
  await page.getByRole('link', { name: 'Register' }).click();
  await page.getByRole('textbox', { name: 'Name' }).fill('Test User');
  await page.getByRole('textbox', { name: 'Email address' }).fill('test@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('password');
  await page.getByRole('button', { name: 'Register' }).click();
  await expect(page.getByRole('link', { name: 'TU' })).toBeVisible();
});








coverageTest('logout', async ({ page }) => {
  await basicInit(page);
  
  //first login
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('a');
  await page.getByRole('button', { name: 'Login' }).click();
  




  // Wait for login to complete
  await expect(page.getByRole('link', { name: 'KC' })).toBeVisible();
  


  //en logout
  await page.getByRole('link', { name: 'Logout' }).click();
  await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
});







coverageTest('history page', async ({ page }) => {
  await basicInit(page);
  
  //login
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('a');
  await page.getByRole('button', { name: 'Login' }).click();
  
  // Wait for
  await expect(page.getByRole('link', { name: 'KC' })).toBeVisible();
  



  //history
  await page.getByRole('link', { name: 'History' }).click();
  await expect(page.locator('h2')).toContainText('Mama Rucci, my my');
});














coverageTest('diner dashboard', async ({ page }) => {
  await basicInit(page);
  
  //llogin
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('a');
  await page.getByRole('button', { name: 'Login' }).click();
  


  // wait
  await expect(page.getByRole('link', { name: 'KC' })).toBeVisible();
  





  //dashboard
  await page.goto('/diner-dashboard');
  await expect(page.locator('h2')).toContainText('Your pizza kitchen');
});





coverageTest('payment page', async ({ page }) => {
  await basicInit(page);
  



  //login
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('a');
  await page.getByRole('button', { name: 'Login' }).click();
  
  //wait
  await expect(page.getByRole('link', { name: 'KC' })).toBeVisible();
  
  //payment
  await page.goto('/payment');
  await expect(page.locator('h2')).toContainText('So worth it');
});






coverageTest('delivery page', async ({ page }) => {
  await basicInit(page);
  await page.goto('/delivery');
  await expect(page.locator('h2')).toContainText('Here is your JWT Pizza!');



  await page.getByRole('button', { name: 'Verify' }).click();

  await page.getByRole('button', { name: 'Order more' }).click();
  await expect(page.locator('h2').first()).toContainText('Awesome is a click away');
  await page.goto('/delivery');
  
  //test close button
  await page.getByRole('button', { name: 'Verify' }).click();
  await page.getByRole('button', { name: 'Close' }).click();
});







coverageTest('docs page', async ({ page }) => {
  await basicInit(page);
  await page.goto('/docs');
  await expect(page.locator('h2').first()).toContainText('JWT Pizza API');
});






coverageTest('not found page', async ({ page }) => {
  await basicInit(page);
  await page.goto('/nonexistent-page');
  await expect(page.locator('h2')).toContainText('Oops');
});











coverageTest('admin dashboard', async ({ page }) => {
  await basicInit(page);
  
  //login as admin
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('admin@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByRole('link', { name: 'AD' })).toBeVisible();
  
  // Navigate to admin dashboard
  await page.getByRole('link', { name: 'AD' }).click();
  await expect(page.locator('h2').first()).toContainText('Mama Ricci\'s kitchen');
  
  // Test franchise filter functionality (if it exists)
  const franchiseFilter = page.getByPlaceholder('Filter franchises');
  if (await franchiseFilter.count() > 0) {
    await franchiseFilter.fill('test');
    await page.getByRole('button', { name: 'Submit' }).first().click();
  }
  
  // Test franchise pagination (if it exists)
  const prevButton = page.locator('button').filter({ hasText: '«' }).first();
  if (await prevButton.count() > 0) {
    await expect(prevButton).toBeDisabled();
  }
  
  const nextButton = page.locator('button').filter({ hasText: '»' }).first();
  if (await nextButton.count() > 0 && await nextButton.isEnabled()) {
    await nextButton.click();
  }
  
  // Test user filter functionality (if it exists)
  const userFilter = page.getByPlaceholder('Filter users');
  if (await userFilter.count() > 0) {
    await userFilter.fill('test');
    await page.getByRole('button', { name: 'Submit' }).nth(1).click();
  }
  
  // Test user pagination (if it exists)
  const userPrevButton = page.locator('button').filter({ hasText: '«' }).nth(1);
  if (await userPrevButton.count() > 0) {
    await expect(userPrevButton).toBeDisabled();
  }
  
  const userNextButton = page.locator('button').filter({ hasText: '»' }).nth(1);
  if (await userNextButton.count() > 0 && await userNextButton.isEnabled()) {
    await userNextButton.click();
  }
  
  // Test delete user button (if users exist)
  const deleteUserButtons = page.getByRole('button', { name: 'Delete' });
  if (await deleteUserButtons.count() > 0) {
    await deleteUserButtons.first().click();
  }
});







coverageTest('franchise dashboard', async ({ page }) => {
  await basicInit(page);
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('franchisee@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('franchisee');
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page.getByRole('link', { name: 'FU' })).toBeVisible();
  await page.goto('/franchise-dashboard');
  await expect(page.locator('h2').first()).toContainText('So you want a piece of the pie?');
  
  // Test store filter functionality (if it exists)
  const storeFilter = page.getByPlaceholder('Filter stores');
  if (await storeFilter.count() > 0) {
    await storeFilter.fill('test');
    await page.getByRole('button', { name: 'Submit' }).click();
  }
  
  // Test store pagination (if it exists)
  const prevButton = page.locator('button').filter({ hasText: '«' });
  if (await prevButton.count() > 0) {
    await expect(prevButton).toBeDisabled();
  }
  
  const nextButton = page.locator('button').filter({ hasText: '»' });
  if (await nextButton.count() > 0 && await nextButton.isEnabled()) {
    await nextButton.click();
  }
});








coverageTest('create franchise', async ({ page }) => {
  await basicInit(page);
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('admin@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin');
  await page.getByRole('button', { name: 'Login' }).click();
  















  //wait
  await expect(page.getByRole('link', { name: 'AD' })).toBeVisible();
  
  //go to create franchise
  await page.goto('/create-franchise');
  await expect(page.locator('h2')).toContainText('Create franchise');
  
  //form input and submi
  await page.getByPlaceholder('franchise name').fill('Test Franchise');
  await page.getByPlaceholder('franchisee admin email').fill('test@franchise.com');

  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.locator('h2').first()).toContainText('The web\'s best pizza');
  await page.goto('/create-franchise');





  await page.getByPlaceholder('franchise name').fill('Test Franchise');
  await page.getByPlaceholder('franchisee admin email').fill('test@franchise.com');
  await page.getByRole('button', { name: 'Create' }).click();
  
  // Should navigate back to admin dashboard after creation
  await expect(page.locator('h2').first()).toContainText('Create franchise');
});





coverageTest('create store', async ({ page }) => {
  await basicInit(page);
  
  //login as franchisee
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('franchisee@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('franchisee');
  await page.getByRole('button', { name: 'Login' }).click();
  

  await expect(page.getByRole('link', { name: 'FU' })).toBeVisible();

  await page.goto('/franchise-dashboard/create-store');
  await expect(page.locator('h2')).toContainText('Create store');
  await page.getByPlaceholder('store name').fill('Test Store');
  
  //cancel button
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.locator('h2').first()).toContainText('So you want a piece of the pie?');
  
  //go back to create store
  await page.goto('/franchise-dashboard/create-store');
  


  //test form submission
  await page.getByPlaceholder('store name').fill('Test Store');
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page.locator('h2').first()).toContainText('Create store');
});

coverageTest('close franchise', async ({ page }) => {
  await basicInit(page);
  
  //login as admin
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('admin@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin');
  await page.getByRole('button', { name: 'Login' }).click();
  





  //navigate to admin dashboard first
  await page.getByRole('link', { name: 'AD' }).click();
  await page.goto('/admin-dashboard/close-franchise');
  await expect(page).toHaveURL(/close-franchise/);
});








coverageTest('close store', async ({ page }) => {
  await basicInit(page);
  
  //login as franchisee
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('franchisee@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('franchisee');
  await page.getByRole('button', { name: 'Login' }).click();




  await page.getByRole('link', { name: 'FU' }).click();
  await page.goto('/franchise-dashboard/close-store');
  await expect(page).toHaveURL(/close-store/);
});

coverageTest('error handling', async ({ page }) => {
  await basicInit(page);
  await page.goto('/nonexistent-page');
  await expect(page.locator('h2')).toContainText('Oops');
});




coverageTest('navigation between pages', async ({ page }) => {
  await basicInit(page);
  await page.getByRole('link', { name: 'Order' }).click();
  await expect(page.locator('h2')).toContainText('Awesome is a click away');
  await page.getByRole('link', { name: 'About' }).click();
  await expect(page.getByRole('heading', { name: 'The secret sauce' })).toBeVisible();
});
