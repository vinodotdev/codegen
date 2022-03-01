/**********************************************
***** This file is generated, do not edit *****
***********************************************/

pub use vino_provider::prelude::*;

pub mod add;
pub mod hello_world;
pub mod http_request;

type Result<T> = std::result::Result<T, WasmError>;

#[no_mangle]
pub(crate) extern "C" fn __guest_call(op_len: i32, req_len: i32) -> i32 {
  use std::slice;

  let buf: Vec<u8> = Vec::with_capacity(req_len as _);
  let req_ptr = buf.as_ptr();

  let opbuf: Vec<u8> = Vec::with_capacity(op_len as _);
  let op_ptr = opbuf.as_ptr();

  let (slice, op) = unsafe {
    wapc::__guest_request(op_ptr, req_ptr);
    (
      slice::from_raw_parts(req_ptr, req_len as _),
      slice::from_raw_parts(op_ptr, op_len as _),
    )
  };

  let op_str = ::std::str::from_utf8(op).unwrap();

  match Dispatcher::dispatch(op_str, slice) {
    Ok(response) => {
      unsafe { wapc::__guest_response(response.as_ptr(), response.len()) }
      1
    }
    Err(e) => {
      let errmsg = e.to_string();
      unsafe {
        wapc::__guest_error(errmsg.as_ptr(), errmsg.len() as _);
      }
      0
    }
  }
}

static ALL_COMPONENTS: &[&str] = &["add", "hello-world", "http-request"];

pub struct Dispatcher {}
impl Dispatch for Dispatcher {
  fn dispatch(op: &str, payload: &[u8]) -> CallResult {
    let payload = IncomingPayload::from_buffer(payload)?;
    let result = match op {
      "add" => add::Component::default().execute(&payload),
      "hello-world" => hello_world::Component::default().execute(&payload),
      "http-request" => http_request::Component::default().execute(&payload),
      _ => Err(WasmError::ComponentNotFound(
        op.to_owned(),
        ALL_COMPONENTS.join(", "),
      )),
    }?;
    Ok(serialize(&result)?)
  }
}

pub mod types {
  use vino_provider::prelude::*;
  #[derive(Debug, PartialEq, serde::Deserialize, serde::Serialize, Clone)]
  pub struct HttpRequest {
    #[serde(rename = "url")]
    pub url: String,
    #[serde(rename = "method")]
    pub method: String,
    #[serde(rename = "link")]
    pub link: ProviderLink,
  }
  #[derive(Debug, PartialEq, serde::Deserialize, serde::Serialize, Clone)]
  pub struct HttpResponse {
    #[serde(rename = "body")]
    pub body: String,
    #[serde(rename = "headers")]
    pub headers: std::collections::HashMap<String, String>,
  }
}

pub mod generated {
  use super::*;
  pub mod add {
    use crate::components::add as implementation;

    pub use vino_provider::prelude::*;

    use super::*;

    #[derive(Default)]
    pub struct Component {}

    impl WapcComponent for Component {
      fn execute(&self, payload: &IncomingPayload) -> JobResult {
        let outputs = get_outputs(payload.id());
        let inputs = populate_inputs(payload)?;
        implementation::job(inputs, outputs)
      }
    }

    fn populate_inputs(payload: &IncomingPayload) -> Result<Inputs> {
      Ok(Inputs {
        left: deserialize(payload.get("left")?)?,
        right: deserialize(payload.get("right")?)?,
      })
    }

    impl From<Inputs> for TransportMap {
      fn from(inputs: Inputs) -> TransportMap {
        let mut map = TransportMap::new();
        map.insert("left".to_owned(), MessageTransport::success(&inputs.left));
        map.insert("right".to_owned(), MessageTransport::success(&inputs.right));
        map
      }
    }

    #[derive(Debug, serde::Deserialize, serde::Serialize, Clone)]
    pub struct Inputs {
      #[serde(rename = "left")]
      pub left: i64,
      #[serde(rename = "right")]
      pub right: i64,
    }

    #[derive(Debug)]
    pub struct OutputPorts {
      pub sum: SumSender,
    }

    #[derive(Debug, PartialEq, Clone)]
    pub struct SumSender {
      id: u32,
    }

    impl PortSender for SumSender {
      type PayloadType = i64;
      fn get_name(&self) -> String {
        "sum".to_string()
      }
      fn get_id(&self) -> u32 {
        self.id
      }
    }

    fn get_outputs(id: u32) -> OutputPorts {
      OutputPorts {
        sum: SumSender { id },
      }
    }

    #[derive(Debug)]
    pub struct Outputs {
      packets: ProviderOutput,
    }

    impl Outputs {
      pub fn sum(&mut self) -> Result<PortOutput> {
        let packets = self
          .packets
          .take("sum")
          .ok_or_else(|| ComponentError::new("No packets for port 'sum' found"))?;
        Ok(PortOutput::new("sum".to_owned(), packets))
      }
    }

    impl From<ProviderOutput> for Outputs {
      fn from(packets: ProviderOutput) -> Self {
        Self { packets }
      }
    }
  }
  pub mod hello_world {
    use crate::components::hello_world as implementation;

    pub use vino_provider::prelude::*;

    use super::*;

    #[derive(Default)]
    pub struct Component {}

    impl WapcComponent for Component {
      fn execute(&self, payload: &IncomingPayload) -> JobResult {
        let outputs = get_outputs(payload.id());
        let inputs = populate_inputs(payload)?;
        implementation::job(inputs, outputs)
      }
    }

    fn populate_inputs(payload: &IncomingPayload) -> Result<Inputs> {
      Ok(Inputs {
        message: deserialize(payload.get("message")?)?,
      })
    }

    impl From<Inputs> for TransportMap {
      fn from(inputs: Inputs) -> TransportMap {
        let mut map = TransportMap::new();
        map.insert(
          "message".to_owned(),
          MessageTransport::success(&inputs.message),
        );
        map
      }
    }

    #[derive(Debug, serde::Deserialize, serde::Serialize, Clone)]
    pub struct Inputs {
      #[serde(rename = "message")]
      pub message: String,
    }

    #[derive(Debug)]
    pub struct OutputPorts {
      pub greeting: GreetingSender,
    }

    #[derive(Debug, PartialEq, Clone)]
    pub struct GreetingSender {
      id: u32,
    }

    impl PortSender for GreetingSender {
      type PayloadType = String;
      fn get_name(&self) -> String {
        "greeting".to_string()
      }
      fn get_id(&self) -> u32 {
        self.id
      }
    }

    fn get_outputs(id: u32) -> OutputPorts {
      OutputPorts {
        greeting: GreetingSender { id },
      }
    }

    #[derive(Debug)]
    pub struct Outputs {
      packets: ProviderOutput,
    }

    impl Outputs {
      pub fn greeting(&mut self) -> Result<PortOutput> {
        let packets = self
          .packets
          .take("greeting")
          .ok_or_else(|| ComponentError::new("No packets for port 'greeting' found"))?;
        Ok(PortOutput::new("greeting".to_owned(), packets))
      }
    }

    impl From<ProviderOutput> for Outputs {
      fn from(packets: ProviderOutput) -> Self {
        Self { packets }
      }
    }
  }
  pub mod http_request {
    use crate::components::http_request as implementation;

    pub use vino_provider::prelude::*;

    use super::*;

    #[derive(Default)]
    pub struct Component {}

    impl WapcComponent for Component {
      fn execute(&self, payload: &IncomingPayload) -> JobResult {
        let outputs = get_outputs(payload.id());
        let inputs = populate_inputs(payload)?;
        implementation::job(inputs, outputs)
      }
    }

    fn populate_inputs(payload: &IncomingPayload) -> Result<Inputs> {
      Ok(Inputs {
        request: deserialize(payload.get("request")?)?,
      })
    }

    impl From<Inputs> for TransportMap {
      fn from(inputs: Inputs) -> TransportMap {
        let mut map = TransportMap::new();
        map.insert(
          "request".to_owned(),
          MessageTransport::success(&inputs.request),
        );
        map
      }
    }

    #[derive(Debug, serde::Deserialize, serde::Serialize, Clone)]
    pub struct Inputs {
      #[serde(rename = "request")]
      pub request: super::types::HttpRequest,
    }

    #[derive(Debug)]
    pub struct OutputPorts {
      pub response: ResponseSender,
    }

    #[derive(Debug, PartialEq, Clone)]
    pub struct ResponseSender {
      id: u32,
    }

    impl PortSender for ResponseSender {
      type PayloadType = super::types::HttpResponse;
      fn get_name(&self) -> String {
        "response".to_string()
      }
      fn get_id(&self) -> u32 {
        self.id
      }
    }

    fn get_outputs(id: u32) -> OutputPorts {
      OutputPorts {
        response: ResponseSender { id },
      }
    }

    #[derive(Debug)]
    pub struct Outputs {
      packets: ProviderOutput,
    }

    impl Outputs {
      pub fn response(&mut self) -> Result<PortOutput> {
        let packets = self
          .packets
          .take("response")
          .ok_or_else(|| ComponentError::new("No packets for port 'response' found"))?;
        Ok(PortOutput::new("response".to_owned(), packets))
      }
    }

    impl From<ProviderOutput> for Outputs {
      fn from(packets: ProviderOutput) -> Self {
        Self { packets }
      }
    }
  }
}
