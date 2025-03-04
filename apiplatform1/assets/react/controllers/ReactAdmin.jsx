import React from "react";
import { HydraAdmin, OpenApiAdmin, ResourceGuesser } from "@api-platform/admin";
import { Datagrid, List, TextField } from "react-admin";

export const TreasureList = (props) => (
  <List {...props}>
    <Datagrid>
      <TextField source="id" />
      <TextField source="name" />
      <TextField source="description" />
      <TextField source="value" />
      <TextField source="coolFactor" />
      <TextField source="shortDescription" />
      <TextField source="plunderedAtAgo" />
    </Datagrid>
  </List>
);

export const UserList = (props) => (
  <List {...props}>
    <Datagrid>
      <TextField source="id" />
      <TextField source="email" />
      <TextField source="username" />
    </Datagrid>
  </List>
);
// http://localhost:8080/admin#/treasures
// http://localhost:8080/admin#/users
export default ({ entrypoint }) => (
  <HydraAdmin entrypoint={`${entrypoint}`}>
    <ResourceGuesser name="treasures" list={TreasureList} />
    <ResourceGuesser name="users" list={UserList} />
  </HydraAdmin>
);

// export default () => <HydraAdmin entrypoint="https://demo.api-platform.com" />;