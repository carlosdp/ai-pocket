import { Box, Button, Text } from '@chakra-ui/react';
import { Routes, Route, Link } from 'react-router-dom';

import { AddContent } from './screens/AddContent';

function Home() {
  return (
    <Box width="100%" maxWidth="936px">
      <Button as={Link} to="/add">
        Add
      </Button>
    </Box>
  );
}

function App() {
  return (
    <Box alignItems="center" flexDirection="column" display="flex" width="100%">
      <Box justifyContent="center" display="flex" width="100%" paddingTop="36px" paddingBottom="36px">
        <Box alignItems="center" flexDirection="row" display="flex" width="100%" maxWidth="936px">
          <Text>Starter</Text>
          <Box marginLeft="auto"></Box>
        </Box>
      </Box>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/add" element={<AddContent />} />
      </Routes>
    </Box>
  );
}

export default App;
