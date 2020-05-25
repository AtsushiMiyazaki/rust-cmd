use tokio;
use iost_rpc::*;
use std::fs::File;
use std::io::prelude::*;
use regex::Regex;

struct SmartContract {
    id: String,
    code: String,
}

impl SmartContract {
    fn new (code: &str, id: &str) -> Self {
        SmartContract {
            id: id.to_owned(),
            code: code.to_owned(),
        }
    }

    fn delete_op_code(&mut self, op_codes: Vec<&str>) {
        for op_code in op_codes {
            match op_code {
                "counter" => {
                    if self.is_containing("_IOSTInstruction_counter") == false {
                        println!("No counter op code found");
                        continue;
                    }

                    println!("Deleting counter op code");
                    let reg_exp = Regex::new(r"_IOSTInstruction_counter.incr\([0-9]*\.?[0-9]+\)[;,]").unwrap();
                    let smart_contract = &reg_exp.replace_all(&self.code, "");
                    self.code = smart_contract.to_string();
                    println!("Deleted counter op code");
                },
                "binary" => {
                    if self.is_containing("_IOSTBinaryOp") == false {
                        println!("No binary op code found");
                        continue;
                    }

                    println!("Deleting binary op code");
                    let reg_exp = Regex::new(r"_IOSTBinaryOp\((?P<a>[^(,]*),{1} (?P<b>[^(,]*),{1} '(?P<c>[^(,]*)'\)").unwrap();
                    let smart_contract = &reg_exp.replace_all(&self.code, "$a $c $b");
                    self.code = smart_contract.to_string();
            
                    let reg_exp = Regex::new(r"_IOSTBinaryOp\((?P<a>.*), (?P<b>.*), '(?P<c>.*)'\)").unwrap();
            
                    while self.is_containing("_IOSTBinaryOp") == false {
                        let smart_contract= &reg_exp.replace_all(&self.code, "$a $c $b");
                        self.code = smart_contract.to_string();
                        println!("Deleted binary op code");
                    }
                },
                "template_tag" => {
                    if self.is_containing("_IOSTTemplateTag") == false {
                        println!("No template op code found");
                        continue;
                    }

                    println!("Deleting template op code");
                    let reg_exp = Regex::new(r"_IOSTTemplateTag`(?P<a>.*)`").unwrap();
                    let smart_contract = &reg_exp.replace_all(&self.code, "`$a`");
                    self.code = smart_contract.to_string();
                    println!("Deleted template op code");
                },
                "spread_element" => {
                    if self.is_containing("_IOSTSpreadElement") == false {
                        println!("No spread op code found");
                        continue;
                    }

                    println!("Deleting spread op code");
                    let reg_exp = Regex::new(r"_IOSTSpreadElement\((?P<a>.*)\)").unwrap();
                    let smart_contract = &reg_exp.replace_all(&self.code, "$a");
                    self.code = smart_contract.to_string();
                    println!("Deleted spread op code");
                },
                _ => {}
            }
        }
    }

    fn is_containing(&self, pattern: &str) -> bool {
        self.code.contains(pattern)
    }
}

#[tokio::main]
async fn main() {
    let host = "http://13.52.105.102:30001";
    // let iost = IOST::new(host);
    let res = match get_contract::get_contract(host, "vote_producer.iost", true).await {
        // let res = match get_contract::get_contract(host, "ContractF2ZGzKX1r2vjbgCsR8bqUaXn8WJ33wsS3gM5vB9xGgD4", true).await {
        Ok(result) => result,
        Err(_) => return,
    };

    let mut contract = SmartContract::new(&res.code, &res.id);
    contract.delete_op_code(vec!["counter", "binary", "template_tag", "spread_element"]);

    let mut file = File::create(format!("./{}.js", contract.id)).expect("Error");
    file.write_all(contract.code.as_bytes()).expect("ERROR");
}
