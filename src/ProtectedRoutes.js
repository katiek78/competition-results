import React from "react";
import { Route, Navigate, Outlet } from "react-router-dom";
import Cookies from "universal-cookie";
const cookies = new Cookies();

// receives component and any other props represented by ...rest
// export default function ProtectedRoutes({ component: Component, ...rest }) {
//   return (

//     // this route takes other routes assigned to it from the App.js and return the same route if condition is met
//     <Route
//       {...rest}
//       render={(props) => {
//         // get cookie from browser if logged in
//         const token = cookies.get("TOKEN");

//         // returns route if there is a valid token set in the cookie
//         if (token) {
//         //  return <Component {...props} />;
//             return <Outlet />
//         } else {
//           // returns the user to the landing page if there is no valid token set
//           return (
//             <Navigate
//               to={{
//                 pathname: "/",
//                 state: {
//                   // sets the location a user was about to access before being redirected to login
//                   from: props.location,
//                 },
//               }}
//             />
//           );
//         }
//       }}
//     />
//   );
// }

const ProtectedRoutes = () => {
        // get cookie from browser if logged in
        const token = cookies.get("TOKEN");

        // returns route if there is a valid token set in the cookie
        if (token) {
        //  return <Component {...props} />;
            return <Outlet />
        } else {
          // returns the user to the landing page if there is no valid token set
          return (
            <Navigate
              to={{
                pathname: "/",
              }}
            />
          );
        }

    // If authorized, return an outlet that will render child elements
    // If not, return element that will navigate to login page
    // return auth ? <Outlet /> : <Navigate to="/login" />;

    // state: {
    //     // sets the location a user was about to access before being redirected to login
    //     from: props.location,
    //   },
}

export default ProtectedRoutes;